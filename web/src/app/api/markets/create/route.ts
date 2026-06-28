import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { FIGHTER_COLUMNS, toRated, type DbFighter } from "@/lib/data/mappers";
import { getMarketsEnv } from "@/lib/markets/env";
import { getMarketProvider, getMarketsProviderKind } from "@/lib/markets";
import { boutToMarketInput } from "@/lib/markets/mapping";
import { requireStaff } from "@/lib/markets/server/staff-guard";
import { MODEL_VERSION, predictBout } from "@/lib/ratings";

export const runtime = "nodejs";

interface MatchupRow {
  id: string;
  bout_order: number;
  weight_class: string | null;
  is_title_fight: boolean;
  red_fighter: DbFighter | null;
  blue_fighter: DbFighter | null;
  events: { name: string | null; event_date: string | null } | null;
}

/**
 * Prepare (and, only when MARKETS_LIVE=true, broadcast) a Rain prediction
 * market for a matchup. In prep mode it builds the exact create-market tx and
 * persists the market definition + model seed to pxf.prediction_markets, with
 * NO onchain transaction. Staff-gated.
 */
export async function POST(req: Request) {
  const gate = await requireStaff(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: { matchupId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const matchupId = body.matchupId;
  if (!matchupId) {
    return NextResponse.json({ error: "matchupId is required." }, { status: 400 });
  }

  const env = getMarketsEnv();
  const admin = createClient({ admin: true }).schema("pxf");

  const { data: matchup, error: matchupErr } = await admin
    .from("matchups")
    .select(
      `id, bout_order, weight_class, is_title_fight, event_id,
       red_fighter:red_fighter_id ( ${FIGHTER_COLUMNS} ),
       blue_fighter:blue_fighter_id ( ${FIGHTER_COLUMNS} ),
       events:event_id ( name, event_date )`
    )
    .eq("id", matchupId)
    .maybeSingle();

  if (matchupErr) {
    return NextResponse.json({ error: matchupErr.message }, { status: 500 });
  }
  const row = matchup as unknown as MatchupRow | null;
  if (!row || !row.red_fighter || !row.blue_fighter) {
    return NextResponse.json(
      { error: "Matchup not found or missing a corner." },
      { status: 404 }
    );
  }

  // 1. Model prediction (the same engine the dashboard uses).
  const prediction = predictBout(toRated(row.red_fighter), toRated(row.blue_fighter));

  // 2. Build the market definition + (in live mode) the create tx.
  const input = boutToMarketInput({
    matchupId: row.id,
    boutNumber: row.bout_order,
    redFighterId: row.red_fighter.id,
    blueFighterId: row.blue_fighter.id,
    redName: row.red_fighter.full_name,
    blueName: row.blue_fighter.full_name,
    weightClass: row.weight_class,
    isTitleFight: row.is_title_fight,
    eventName: row.events?.name,
    eventDate: row.events?.event_date,
    modelOdds: prediction,
  });

  const provider = getMarketProvider();
  const built = await provider.createMarket(input);

  // 3. Optional broadcast — only when explicitly enabled.
  let broadcast: { sent: boolean; txHashes?: string[]; error?: string } = { sent: false };
  let status: "pending" | "created" = "pending";
  if (env.live && getMarketsProviderKind() === "rain" && built.transactions.length > 0) {
    try {
      const { getServerExecutor } = await import("@/lib/markets/execution");
      const hashes = await getServerExecutor().send(built.transactions);
      broadcast = { sent: true, txHashes: hashes };
      status = "created";
    } catch (err) {
      broadcast = { sent: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // 4. Persist the prepared market (idempotent per matchup).
  const record = {
    matchup_id: row.id,
    chain: getMarketsProviderKind() === "rain" ? "arbitrum-one" : null,
    status,
    red_implied_prob: prediction.red,
    blue_implied_prob: prediction.blue,
    model_confidence: prediction.confidence,
    model_version: MODEL_VERSION,
    market_config: built.config,
    rain_market_id: built.marketId,
    created_by: gate.userId,
  };

  const { data: existing } = await admin
    .from("prediction_markets")
    .select("id")
    .eq("matchup_id", row.id)
    .maybeSingle();

  let saved;
  if (existing?.id) {
    const { data, error } = await admin
      .from("prediction_markets")
      .update(record)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = data;
  } else {
    const { data, error } = await admin
      .from("prediction_markets")
      .insert(record)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = data;
  }

  return NextResponse.json({
    prepared: true,
    live: env.live,
    broadcast,
    prediction,
    transactionsBuilt: built.transactions.length,
    market: saved,
  });
}
