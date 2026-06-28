/**
 * Glicko-style rating math.
 *
 * A fighter's strength is a pair: rating (`elo`) + deviation (`rd`, a.k.a.
 * uncertainty). The key idea over plain Elo is that uncertainty *attenuates*
 * the win probability — a big rating gap between two fighters we barely know
 * (high RD) is pulled back toward a coin flip, instead of being treated as
 * gospel. That is what keeps debutant/thin-data predictions honest.
 */

export const DEFAULT_ELO = 1500;
/** Max deviation — a fighter we know nothing about (debut / unknown record). */
export const DEFAULT_RD = 350;
/** Floor deviation — a seasoned fighter with a long, known record. */
export const MIN_RD = 90;

/** Glicko q constant = ln(10) / 400. */
const Q = Math.LN10 / 400;

/** Reduction factor g(RD): →1 when RD is small (certain), →0 when RD is large. */
export function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));
}

/** Combined deviation of a matchup (independent fighters). */
export function combinedRd(rdA: number, rdB: number): number {
  return Math.sqrt(rdA * rdA + rdB * rdB);
}

/**
 * Uncertainty-attenuated win probability for A over B (0..1).
 * High combined RD shrinks g → the curve flattens toward 0.5.
 */
export function winProbability(
  ratingA: number,
  ratingB: number,
  rdA: number = DEFAULT_RD,
  rdB: number = DEFAULT_RD
): number {
  const gf = g(combinedRd(rdA, rdB));
  return 1 / (1 + 10 ** ((-gf * (ratingA - ratingB)) / 400));
}

export interface Rating {
  rating: number;
  rd: number;
}

export interface SeedRecordInput {
  wins?: number | null;
  losses?: number | null;
  draws?: number | null;
  no_contests?: number | null;
  pro_status?: "amateur" | "pro" | null;
}

/**
 * Prior rating from an aggregate record. Mirrors the SQL
 * `pxf.seed_initial_ratings()` so the static/JSON path and the DB path agree.
 * Used as a fallback when a fighter has no persisted `elo` yet.
 */
export function seedRatingFromRecord(input: SeedRecordInput): Rating {
  const wins = input.wins ?? null;
  const losses = input.losses ?? null;
  const known = wins != null || losses != null;
  const w = wins ?? 0;
  const l = losses ?? 0;
  const total = w + l + (input.draws ?? 0) + (input.no_contests ?? 0);
  const decided = w + l;
  const winrate = decided > 0 ? w / decided : 0.5;

  let rating =
    DEFAULT_ELO +
    (input.pro_status === "pro" ? 40 : 0) +
    clamp(w - l, -8, 8) * 20 +
    (winrate - 0.5) * 200;
  rating = clamp(rating, 1250, 1850);

  const rd = !known || total === 0 ? DEFAULT_RD : Math.max(MIN_RD, DEFAULT_RD - 30 * total);

  return { rating: Math.round(rating), rd: Math.round(rd) };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * Legacy helper kept for back-compat: plain logistic Elo → integer percents
 * summing to 100. Prefer `predictBout` for real predictions.
 */
export function eloWinProbability(
  redElo: number = DEFAULT_ELO,
  blueElo: number = DEFAULT_ELO
): { red: number; blue: number } {
  const red = Math.round(winProbability(redElo, blueElo, MIN_RD, MIN_RD) * 100);
  return { red, blue: Math.max(0, 100 - red) };
}
