/**
 * Model → market glue.
 *
 * Turns a finalized bout + its model prediction into the exact Rain
 * create-market parameters. The model's win probability seeds the market's
 * initial price (`barValues`), so a fresh market opens at the analytics number
 * instead of a flat 50/50.
 */

import type { CreateMarketInput, OddsSnapshot, RainMarketConfig } from "@/lib/markets/types";
import { getMarketsEnv } from "@/lib/markets/env";

export interface BoutMarketSeed {
  matchupId: string;
  boutNumber: number;
  redFighterId: string;
  blueFighterId: string;
  redName: string;
  blueName: string;
  weightClass?: string | null;
  isTitleFight?: boolean;
  eventName?: string | null;
  /** ISO date (YYYY-MM-DD) of the event. */
  eventDate?: string | null;
  modelOdds: OddsSnapshot;
}

const SEVEN_DAYS_S = 7 * 24 * 60 * 60;

/** Market closes at end of event day, or 7 days out if no date is known. */
function resolveWindow(eventDate?: string | null): { startTime: number; endTime: number } {
  const nowS = Math.floor(Date.now() / 1000);
  if (eventDate) {
    const end = Math.floor(new Date(`${eventDate}T23:59:59Z`).getTime() / 1000);
    if (!Number.isNaN(end) && end > nowS) return { startTime: nowS, endTime: end };
  }
  return { startTime: nowS, endTime: nowS + SEVEN_DAYS_S };
}

/** Clamp model odds to a sane non-zero seed (Rain rejects 0/100 bars). */
function seedBars(odds: OddsSnapshot): [number, number] {
  const red = Math.min(95, Math.max(5, Math.round(odds.red)));
  return [red, 100 - red];
}

export function boutToMarketConfig(seed: BoutMarketSeed): RainMarketConfig {
  const env = getMarketsEnv();
  const { startTime, endTime } = resolveWindow(seed.eventDate);
  const title = seed.isTitleFight ? " (title fight)" : "";
  const event = seed.eventName ? ` at ${seed.eventName}` : "";

  return {
    question: `${seed.redName} vs ${seed.blueName}${event}: who wins?`,
    description:
      `PXF ${seed.weightClass ?? ""} bout${title}${event}. ` +
      `Market resolves to the official winner of ${seed.redName} vs ${seed.blueName}.`,
    options: [`${seed.redName} (Red)`, `${seed.blueName} (Blue)`],
    tags: ["mma", "pxf", ...(seed.weightClass ? [seed.weightClass] : [])],
    barValues: seedBars(seed.modelOdds),
    baseToken: env.baseToken,
    tokenDecimals: env.tokenDecimals,
    seedLiquidityWei: env.seedLiquidityWei,
    startTime,
    endTime,
  };
}

export function boutToMarketInput(seed: BoutMarketSeed): CreateMarketInput {
  const env = getMarketsEnv();
  return {
    matchupId: seed.matchupId,
    boutNumber: seed.boutNumber,
    redFighterId: seed.redFighterId,
    blueFighterId: seed.blueFighterId,
    modelOdds: seed.modelOdds,
    config: boutToMarketConfig(seed),
    creator: env.creator,
  };
}
