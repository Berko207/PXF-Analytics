/**
 * @deprecated The rating logic now lives in `@/lib/ratings`. This module is a
 * thin re-export kept so existing imports keep compiling. Prefer
 * `predictBout` for predictions and `eloWinProbability` only for the legacy
 * plain-Elo display.
 */
export { eloWinProbability, DEFAULT_ELO } from "@/lib/ratings/glicko";
