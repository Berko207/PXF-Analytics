import cardData from "@/data/pxf50_card.json";
import type { Bout, FightCard, Fighter } from "@/types/fight-card";

/** Load the current event fight card (static JSON for v0.1). */
export function getFightCard(): FightCard {
  return cardData as FightCard;
}

/** Find a bout by its display number. */
export function getBoutByNumber(boutNumber: number): Bout | undefined {
  return getFightCard().bouts.find((bout) => bout.bout_number === boutNumber);
}

/** Collect unique fighters across the card. */
export function getAllFighters(): Fighter[] {
  const fighters: Fighter[] = [];
  for (const bout of getFightCard().bouts) {
    fighters.push(bout.red_corner, bout.blue_corner);
  }
  return fighters;
}

/** Resolve a fighter by id from any bout corner. */
export function getFighterById(fighterId: string): Fighter | undefined {
  return getAllFighters().find((fighter) => fighter.fighter_id === fighterId);
}
