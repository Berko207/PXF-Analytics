import { getFightCardStatic } from "@/lib/data/static";
import { loadFightCardFromSupabase } from "@/lib/data/supabase";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Bout, FightCard, Fighter } from "@/types/fight-card";

export { getEvent, getFighters, getMatchups, loadFightCardFromSupabase } from "@/lib/data/supabase";
export { getFightCardStatic } from "@/lib/data/static";
export { hasSupabaseConfig } from "@/lib/supabase/env";

/** Sync loader — always returns static JSON (for legacy client components). */
export function getFightCardSync(): FightCard {
  return getFightCardStatic();
}

/** Primary loader: Supabase when configured, else static JSON fallback. */
export async function getFightCard(
  slug?: string
): Promise<FightCard> {
  if (hasSupabaseConfig()) {
    try {
      const card = await loadFightCardFromSupabase(slug);
      if (card) return card;
    } catch (error) {
      console.warn("[getFightCard] Supabase fetch failed; using static JSON.", error);
    }
  }
  return getFightCardStatic();
}

export function getBoutByNumber(boutNumber: number, card?: FightCard): Bout | undefined {
  const source = card ?? getFightCardSync();
  return source.bouts.find((bout) => bout.bout_number === boutNumber);
}

export function getAllFighters(card?: FightCard): Fighter[] {
  const source = card ?? getFightCardSync();
  const fighters: Fighter[] = [];
  for (const bout of source.bouts) {
    fighters.push(bout.red_corner, bout.blue_corner);
  }
  return fighters;
}

export function getFighterById(fighterId: string, card?: FightCard): Fighter | undefined {
  return getAllFighters(card).find((fighter) => fighter.fighter_id === fighterId);
}
