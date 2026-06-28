import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_EVENT_SLUG,
  mapToFightCard,
  type DbEvent,
  type DbFighter,
  type DbMatchup,
} from "@/lib/data/mappers";
import type { FightCard } from "@/types/fight-card";

function pxf() {
  return createClient().schema("pxf");
}

/** Fetch a single event by slug. */
export async function getEvent(slug: string = DEFAULT_EVENT_SLUG): Promise<DbEvent | null> {
  const { data, error } = await pxf()
    .from("events")
    .select(
      "id, name, slug, event_date, venue, city, country, promoters(name, region)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as DbEvent | null;
}

/** All fighters referenced on an event's main card matchups. */
export async function getFighters(eventId: string): Promise<DbFighter[]> {
  const { data: matchups, error: matchupError } = await pxf()
    .from("matchups")
    .select("red_fighter_id, blue_fighter_id")
    .eq("event_id", eventId);

  if (matchupError) throw matchupError;

  const ids = new Set<string>();
  for (const row of matchups ?? []) {
    if (row.red_fighter_id) ids.add(row.red_fighter_id);
    if (row.blue_fighter_id) ids.add(row.blue_fighter_id);
  }

  if (ids.size === 0) return [];

  const { data, error } = await pxf()
    .from("fighters")
    .select(
      "id, slug, full_name, nickname, weight_class, gym, city, country, pro_status, wins, losses, draws, no_contests, tapology_url, elo, field_status"
    )
    .in("id", Array.from(ids));

  if (error) throw error;
  return (data ?? []) as DbFighter[];
}

/** Matchups for an event with corners and optional prediction market row. */
export async function getMatchups(eventId: string): Promise<DbMatchup[]> {
  const { data, error } = await pxf()
    .from("matchups")
    .select(
      `
      id,
      event_id,
      bout_order,
      weight_class,
      is_title_fight,
      red_fighter:red_fighter_id (
        id, slug, full_name, nickname, weight_class, gym, city, country,
        pro_status, wins, losses, draws, no_contests, tapology_url, elo, field_status
      ),
      blue_fighter:blue_fighter_id (
        id, slug, full_name, nickname, weight_class, gym, city, country,
        pro_status, wins, losses, draws, no_contests, tapology_url, elo, field_status
      ),
      prediction_markets (
        id, matchup_id, rain_market_id, status, red_implied_prob, blue_implied_prob
      )
    `
    )
    .eq("event_id", eventId)
    .order("bout_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as DbMatchup[];
}

/** Load the full fight card from Supabase. */
export async function loadFightCardFromSupabase(
  slug: string = DEFAULT_EVENT_SLUG
): Promise<FightCard | null> {
  const event = await getEvent(slug);
  if (!event) return null;

  const matchups = await getMatchups(event.id);
  if (matchups.length === 0) return null;

  return mapToFightCard(event, matchups);
}
