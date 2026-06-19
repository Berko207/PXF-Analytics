import { getFightCard } from "@/lib/data";
import type { EventStats } from "@/types/fight-card";

/** Compute dashboard overview stats from the loaded fight card. */
export function getEventStats(): EventStats {
  const card = getFightCard();
  const proBouts = card.bouts.filter((bout) => bout.level === "PRO").length;
  const amateurBouts = card.bouts.filter((bout) => bout.level === "AMATEUR").length;
  const titleFights = card.bouts.filter((bout) => bout.is_title_fight).length;

  return {
    totalBouts: card.metadata.total_bouts,
    proBouts,
    amateurBouts,
    titleFights,
    debuts: card.metadata.debut_fighters,
    matchedFighters: card.metadata.matched_fighters,
    unmatchedNames: card.metadata.unmatched_names,
  };
}
