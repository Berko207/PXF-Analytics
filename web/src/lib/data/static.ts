import cardData from "@/data/pxf50_card.json";
import type { FightCard } from "@/types/fight-card";

/** Static JSON fallback (v0.1 enrichment pipeline output). */
export function getFightCardStatic(): FightCard {
  return cardData as FightCard;
}
