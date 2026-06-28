import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getMarketsEnv } from "@/lib/markets/env";
import { getMarketProvider, getMarketsProviderKind } from "@/lib/markets";
import { requireStaff } from "@/lib/markets/server/staff-guard";

export const runtime = "nodejs";

/**
 * Resolve a prepared market to a winner and (when live) broadcast the
 * close + choose-winner txs, then record a settlement row. In prep mode it
 * builds the txs and writes a pending settlement without touching the chain.
 * Winner is taken from the request body, falling back to the recorded result.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireStaff(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const marketId = params.id;
  let body: { winner?: "red" | "blue" } = {};
  try {
    body = await req.json();
  } catch {
    /* body optional — fall back to recorded result */
  }

  const env = getMarketsEnv();
  const admin = createClient({ admin: true }).schema("pxf");

  const { data: market, error: marketErr } = await admin
    .from("prediction_markets")
    .select("id, matchup_id, rain_market_id, status")
    .eq("id", marketId)
    .maybeSingle();
  if (marketErr) return NextResponse.json({ error: marketErr.message }, { status: 500 });
  if (!market) return NextResponse.json({ error: "Market not found." }, { status: 404 });

  // Determine the winner: explicit body, else the recorded fight result.
  let winner = body.winner;
  let resultId: string | null = null;
  if (!winner) {
    const { data: result } = await admin
      .from("results")
      .select("id, winner_fighter_id, matchup:matchup_id ( red_fighter_id, blue_fighter_id )")
      .eq("matchup_id", market.matchup_id)
      .maybeSingle();
    const m = result as unknown as {
      id: string;
      winner_fighter_id: string | null;
      matchup: { red_fighter_id: string | null; blue_fighter_id: string | null } | null;
    } | null;
    if (m?.winner_fighter_id && m.matchup) {
      resultId = m.id;
      winner =
        m.winner_fighter_id === m.matchup.red_fighter_id
          ? "red"
          : m.winner_fighter_id === m.matchup.blue_fighter_id
            ? "blue"
            : undefined;
    }
  }

  if (!winner) {
    return NextResponse.json(
      { error: "No winner provided and no decisive result recorded." },
      { status: 400 }
    );
  }

  // Build resolve tx(s). Needs an onchain market id.
  let transactionsBuilt = 0;
  let broadcast: { sent: boolean; txHashes?: string[]; error?: string } = { sent: false };
  if (market.rain_market_id) {
    const provider = getMarketProvider();
    const txs = (await provider.resolve(market.rain_market_id, winner)) as unknown[];
    transactionsBuilt = Array.isArray(txs) ? txs.length : 0;

    if (env.live && getMarketsProviderKind() === "rain" && transactionsBuilt > 0) {
      try {
        const { getServerExecutor } = await import("@/lib/markets/execution");
        const hashes = await getServerExecutor().send(txs as Parameters<
          Awaited<ReturnType<typeof getServerExecutor>>["send"]
        >[0]);
        broadcast = { sent: true, txHashes: hashes };
      } catch (err) {
        broadcast = { sent: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  // Record a settlement (pending until the chain confirms).
  const { data: settlement, error: settleErr } = await admin
    .from("settlements")
    .insert({
      market_id: market.id,
      result_id: resultId,
      status: broadcast.sent ? "synced" : "pending",
      settled_at: broadcast.sent ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (settleErr) return NextResponse.json({ error: settleErr.message }, { status: 500 });

  if (broadcast.sent) {
    await admin
      .from("prediction_markets")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", market.id);
  }

  return NextResponse.json({
    winner,
    live: env.live,
    transactionsBuilt,
    broadcast,
    settlement,
  });
}
