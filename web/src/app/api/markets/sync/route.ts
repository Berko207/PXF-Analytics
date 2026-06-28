import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getMarketsEnv } from "@/lib/markets/env";
import { getMarketsProviderKind } from "@/lib/markets";
import { requireStaff } from "@/lib/markets/server/staff-guard";

export const runtime = "nodejs";

/**
 * Chain → DB indexer (scaffold). For every market with an onchain id, pulls
 * recent trades from Rain and upserts them into pxf.orders_trades. Designed to
 * run on a cron once markets are live. In prep mode (no onchain markets,
 * provider=mock, or subgraph unset) it is a safe no-op that reports why.
 */
export async function POST(req: Request) {
  const gate = await requireStaff(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const env = getMarketsEnv();
  if (getMarketsProviderKind() !== "rain") {
    return NextResponse.json({ synced: 0, note: "Provider is mock; nothing to index." });
  }
  if (!env.subgraphUrl) {
    return NextResponse.json({
      synced: 0,
      note: "RAIN_SUBGRAPH_URL not configured; trade history requires the subgraph.",
    });
  }

  const admin = createClient({ admin: true }).schema("pxf");
  const { data: markets, error } = await admin
    .from("prediction_markets")
    .select("id, rain_market_id, contract_address")
    .not("rain_market_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const onchain = markets ?? [];
  if (onchain.length === 0) {
    return NextResponse.json({ synced: 0, note: "No onchain markets to index yet." });
  }

  // TODO (live): for each market, rain.getMarketTransactions({ marketAddress })
  // → upsert into pxf.orders_trades keyed by tx_hash. Wired when markets go live.
  return NextResponse.json({
    synced: 0,
    pending: onchain.length,
    note: "Indexer scaffold — trade ingestion wires in when markets are live.",
  });
}
