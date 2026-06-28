const DEFAULT_ELO = 1500;

/** Logistic win probability from ELO ratings (returns integer percents summing to 100). */
export function eloWinProbability(
  redElo: number = DEFAULT_ELO,
  blueElo: number = DEFAULT_ELO
): { red: number; blue: number } {
  const redProb = 1 / (1 + 10 ** ((blueElo - redElo) / 400));
  const red = Math.round(redProb * 100);
  const blue = Math.max(0, 100 - red);
  return { red, blue };
}

export { DEFAULT_ELO };
