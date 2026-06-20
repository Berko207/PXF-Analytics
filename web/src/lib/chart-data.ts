import { getFightCard } from "@/lib/data";

export interface OddsSnapshot {
  day: string;
  red: number;
  blue: number;
}

/** Placeholder odds movement for a bout (simulated market drift). */
export function getOddsMovement(boutNumber: number): OddsSnapshot[] {
  const bout = getFightCard().bouts.find((item) => item.bout_number === boutNumber);
  if (!bout) return [];

  const finalRed = bout.win_probability.red;
  const finalBlue = bout.win_probability.blue;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return labels.map((day, index) => {
    const progress = index / (labels.length - 1);
    const drift = (0.5 - progress) * 8;
    const red = Math.round(Math.min(95, Math.max(5, finalRed + drift * (index % 2 === 0 ? 1 : -0.5))));
    return { day, red, blue: 100 - red };
  }).map((point, index, arr) =>
    index === arr.length - 1 ? { ...point, red: finalRed, blue: finalBlue } : point
  );
}

/** Probability summary for all bouts (bar chart data). */
export function getBoutProbabilitySummary() {
  return getFightCard().bouts.map((bout) => ({
    bout: `#${bout.bout_number}`,
    label: bout.label,
    red: bout.win_probability.red,
    blue: bout.win_probability.blue,
  }));
}
