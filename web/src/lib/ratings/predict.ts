/**
 * Bout prediction engine.
 *
 * Pipeline: uncertainty-attenuated Elo (the dominant signal) → bounded
 * contextual nudges in logit space (finish threat, activity, age, reach) →
 * clamped probability + a confidence score + human-readable factors.
 *
 * Every nudge is capped and the total is capped, so context can tilt a fight
 * but never overpower the ratings. Confidence blends how much we know (low
 * combined RD) with how lopsided the call is.
 */

import {
  DEFAULT_RD,
  MIN_RD,
  clamp,
  clamp01,
  combinedRd,
  g,
  seedRatingFromRecord,
  winProbability,
  type Rating,
} from "@/lib/ratings/glicko";

export interface RatedFighter {
  display_name?: string | null;
  elo?: number | null;
  elo_uncertainty?: number | null;
  wins?: number | null;
  losses?: number | null;
  draws?: number | null;
  no_contests?: number | null;
  wins_ko?: number | null;
  wins_sub?: number | null;
  wins_dec?: number | null;
  losses_ko?: number | null;
  losses_sub?: number | null;
  losses_dec?: number | null;
  last_fight_date?: string | null;
  date_of_birth?: string | null;
  height_cm?: number | null;
  reach_cm?: number | null;
  pro_status?: "amateur" | "pro" | null;
}

/** A single driver of the prediction, in approximate percentage points for red. */
export interface PredictionFactor {
  label: string;
  /** Signed pp effect on the red corner's probability (+ favors red). */
  impact: number;
}

export interface BoutPrediction {
  /** Integer percents, summing to 100. */
  red: number;
  blue: number;
  /** 0–100: trust in this pick (data quality × decisiveness). */
  confidence: number;
  /** Ordered, largest-magnitude first. Empty when only ratings drive it. */
  factors: PredictionFactor[];
}

/** Bump when the prediction math changes — persisted with each prepared market. */
export const MODEL_VERSION = "pxf-elo-glicko-v1";

const PROB_FLOOR = 0.03;
const PROB_CEIL = 0.97;
/** Per-nudge and total caps (logit units) keep ratings dominant. */
const NUDGE_CAP = 0.35;
const TOTAL_NUDGE_CAP = 0.8;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

function logit(p: number): number {
  const c = clamp(p, 1e-6, 1 - 1e-6);
  return Math.log(c / (1 - c));
}
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function ratingOf(f: RatedFighter): Rating {
  if (f.elo != null) {
    return { rating: f.elo, rd: f.elo_uncertainty ?? DEFAULT_RD };
  }
  return seedRatingFromRecord(f);
}

/** Finish rate = (KO + Sub) wins / total wins, only when the split is known. */
function finishRate(f: RatedFighter): number | null {
  const wins = f.wins ?? 0;
  if (wins <= 0) return null;
  if (f.wins_ko == null && f.wins_sub == null) return null;
  const finishes = (f.wins_ko ?? 0) + (f.wins_sub ?? 0);
  return clamp01(finishes / wins);
}

function monthsSince(date?: string | null): number | null {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / MS_PER_MONTH;
}

/** Ring rust: no penalty under 18 months, ramping to a cap by ~42 months. */
function layoffPenalty(f: RatedFighter): number {
  const months = monthsSince(f.last_fight_date);
  if (months == null || months <= 18) return 0;
  return clamp((months - 18) / 24, 0, 1) * NUDGE_CAP;
}

function ageFrom(dob?: string | null): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (MS_PER_MONTH * 12);
}

/** Athletic-prime curve: flat 24–32, declines after, slight youth discount. */
function agePenalty(f: RatedFighter): number {
  const age = ageFrom(f.date_of_birth);
  if (age == null) return 0;
  if (age >= 24 && age <= 32) return 0;
  if (age > 32) return clamp((age - 32) / 10, 0, 1) * NUDGE_CAP;
  return clamp((21 - age) / 6, 0, 1) * (NUDGE_CAP * 0.6); // under 21
}

function pushFactor(
  factors: PredictionFactor[],
  label: string,
  baseLogit: number,
  nudge: number
): void {
  if (Math.abs(nudge) < 1e-6) return;
  const impact = Math.round((sigmoid(baseLogit + nudge) - sigmoid(baseLogit)) * 100);
  if (impact === 0) return;
  factors.push({ label, impact });
}

/**
 * Predict a bout. `red`/`blue` accept partial fighter data; everything missing
 * degrades gracefully (the prediction simply leans more on ratings).
 */
export function predictBout(red: RatedFighter, blue: RatedFighter): BoutPrediction {
  const r = ratingOf(red);
  const b = ratingOf(blue);

  const basP = winProbability(r.rating, b.rating, r.rd, b.rd);
  const baseLogit = logit(basP);
  const factors: PredictionFactor[] = [];

  // Ratings are always the headline driver.
  pushFactor(factors, "Elo rating edge", logit(0.5), baseLogit - logit(0.5));

  let nudge = 0;

  // Finish threat — a knockout/submission artist is live in any exchange.
  const rf = finishRate(red);
  const bf = finishRate(blue);
  if (rf != null && bf != null) {
    const n = clamp((rf - bf) * 0.7, -NUDGE_CAP, NUDGE_CAP);
    nudge += n;
    pushFactor(factors, "Finishing threat", baseLogit, n);
  }

  // Activity / ring rust (favors the more active corner).
  const layoff = clamp(layoffPenalty(blue) - layoffPenalty(red), -NUDGE_CAP, NUDGE_CAP);
  if (layoff !== 0) {
    nudge += layoff;
    pushFactor(factors, "Activity / ring rust", baseLogit, layoff);
  }

  // Age / athletic prime.
  const ageN = clamp(agePenalty(blue) - agePenalty(red), -NUDGE_CAP, NUDGE_CAP);
  if (ageN !== 0) {
    nudge += ageN;
    pushFactor(factors, "Age & prime", baseLogit, ageN);
  }

  // Reach advantage (small, capped).
  if (red.reach_cm != null && blue.reach_cm != null) {
    const n = clamp(((red.reach_cm - blue.reach_cm) / 10) * 0.05, -0.2, 0.2);
    if (n !== 0) {
      nudge += n;
      pushFactor(factors, "Reach advantage", baseLogit, n);
    }
  }

  nudge = clamp(nudge, -TOTAL_NUDGE_CAP, TOTAL_NUDGE_CAP);

  const finalP = clamp(sigmoid(baseLogit + nudge), PROB_FLOOR, PROB_CEIL);
  const redPct = Math.round(finalP * 100);

  // Confidence: data quality (g of combined RD) × decisiveness (distance from 50).
  const dataQuality = clamp01(g(combinedRd(r.rd, b.rd)));
  const decisiveness = 0.5 + Math.abs(finalP - 0.5); // 0.5 (coin flip) .. 1.0
  const confidence = Math.round(100 * dataQuality * decisiveness);

  factors.sort((a, c) => Math.abs(c.impact) - Math.abs(a.impact));

  return {
    red: redPct,
    blue: 100 - redPct,
    confidence,
    factors,
  };
}

/** Coarse band for UI copy. */
export function confidenceLabel(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 66) return "high";
  if (confidence >= 40) return "medium";
  return "low";
}

export { MIN_RD, DEFAULT_RD };
