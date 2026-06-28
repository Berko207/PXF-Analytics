/** Probability ↔ betting odds helpers (Rain markets quote implied %). */

export interface OddsPair {
  red: number;
  blue: number;
}

/** Implied probability to American moneyline (e.g. 65 → -186, 35 → +186). */
export function probToAmerican(prob: number): string {
  const p = Math.min(99, Math.max(1, prob));
  if (p >= 50) {
    return `-${Math.round((p / (100 - p)) * 100)}`;
  }
  return `+${Math.round(((100 - p) / p) * 100)}`;
}

/** Implied probability to decimal odds (e.g. 65 → 1.54). */
export function probToDecimal(prob: number): string {
  const p = Math.min(99, Math.max(1, prob));
  return (100 / p).toFixed(2);
}

/** Percentage-point edge on the red corner (model − market). Positive = model likes red more. */
export function redEdge(model: OddsPair, market: OddsPair): number {
  return Math.round((model.red - market.red) * 10) / 10;
}

/** Which corner the model favors more than the market, if the gap is meaningful. */
export function modelEdgeSummary(
  model: OddsPair,
  market: OddsPair,
  threshold = 2
): { corner: "red" | "blue"; delta: number } | null {
  const edge = redEdge(model, market);
  if (Math.abs(edge) < threshold) return null;
  return edge > 0
    ? { corner: "red", delta: edge }
    : { corner: "blue", delta: Math.abs(edge) };
}

export function favoriteCorner(odds: OddsPair): "red" | "blue" {
  return odds.red >= odds.blue ? "red" : "blue";
}
