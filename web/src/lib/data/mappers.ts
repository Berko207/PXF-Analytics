import type {
  Bout,
  BoutLevel,
  BoutMarketInfo,
  BoutSummary,
  EventInfo,
  FightCard,
  Fighter,
  FighterRecord,
  FighterStatus,
  MarketStatus,
  WinProbability,
} from "@/types/fight-card";
import { eloWinProbability } from "@/lib/markets/elo";

const DEFAULT_EVENT_SLUG = "pxf-50";

const BOUT_LABELS: Record<number, string> = {
  1: "Main Event",
  2: "Co-Main Event",
};

export interface DbPromoter {
  name: string;
  region: string | null;
}

export interface DbEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  promoters: DbPromoter | DbPromoter[] | null;
}

export interface DbFighter {
  id: string;
  slug: string | null;
  full_name: string;
  nickname: string | null;
  weight_class: string | null;
  gym: string | null;
  city: string | null;
  country: string | null;
  pro_status: "amateur" | "pro" | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  no_contests: number | null;
  tapology_url: string | null;
  elo: number | null;
  field_status: Record<string, string> | null;
}

export interface DbPredictionMarket {
  id: string;
  matchup_id: string;
  rain_market_id: string | null;
  status: MarketStatus;
  red_implied_prob: number | null;
  blue_implied_prob: number | null;
}

export interface DbMatchup {
  id: string;
  event_id: string;
  bout_order: number;
  weight_class: string | null;
  is_title_fight: boolean;
  red_fighter: DbFighter | null;
  blue_fighter: DbFighter | null;
  prediction_markets: DbPredictionMarket[] | DbPredictionMarket | null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatRecord(
  wins: number | null,
  losses: number | null,
  draws: number | null,
  nc: number | null
): { record: FighterRecord | null; display: string | null } {
  if (wins == null && losses == null && draws == null && nc == null) {
    return { record: null, display: null };
  }
  const w = wins ?? 0;
  const l = losses ?? 0;
  const d = draws ?? 0;
  const n = nc ?? 0;
  return {
    record: { wins: w, losses: l, draws: d, nc: n },
    display: `${w}-${l}-${d}${n ? ` (${n} NC)` : ""}`,
  };
}

function inferFighterStatus(
  fieldStatus: Record<string, string> | null,
  hasRecord: boolean
): FighterStatus {
  const identity = fieldStatus?.identity;
  if (identity === "verified") return "matched";
  if (identity === "imported") return hasRecord ? "matched" : "suggested";
  if (identity === "missing") return "debut";
  return hasRecord ? "matched" : "suggested";
}

function mapFighter(row: DbFighter, cornerLabel: string): Fighter {
  const { record, display } = formatRecord(
    row.wins,
    row.losses,
    row.draws,
    row.no_contests
  );
  const tapologyUrl =
    row.tapology_url ??
    `https://www.tapology.com/search?term=${encodeURIComponent(row.full_name)}`;
  const profileUrl =
    row.tapology_url && row.tapology_url.includes("/fightcenter/fighters/")
      ? row.tapology_url
      : null;
  const status = inferFighterStatus(row.field_status, record != null);

  return {
    original_name: row.slug ?? cornerLabel,
    display_name: row.full_name,
    full_name: row.full_name,
    nickname: row.nickname,
    tapology_search_term: row.full_name,
    research_notes: null,
    canonical_name: row.slug,
    fighter_id: row.slug ?? row.id,
    is_matched: status === "matched",
    is_debut: status === "debut",
    match_score: status === "matched" ? 100 : 0,
    record,
    record_display: display,
    weight_class: row.weight_class,
    gym: row.gym,
    city: row.city,
    country: row.country,
    tapology_url: tapologyUrl,
    tapology: {
      search_url: tapologyUrl,
      profile_url: profileUrl,
    },
    profiles: {
      tapology: tapologyUrl,
      sherdog: null,
    },
    status,
    elo: row.elo ?? undefined,
  };
}

function boutLabel(order: number): string {
  return BOUT_LABELS[order] ?? `Bout ${order}`;
}

function boutLevel(red: DbFighter | null, blue: DbFighter | null): BoutLevel {
  if (red?.pro_status === "pro" || blue?.pro_status === "pro") return "PRO";
  return "AMATEUR";
}

function mapMarket(row: DbPredictionMarket | null, matchupId: string): BoutMarketInfo | null {
  if (!row) {
    return {
      id: null,
      matchup_id: matchupId,
      status: "pending",
      rain_market_id: null,
    };
  }
  return {
    id: row.id,
    matchup_id: row.matchup_id,
    status: row.status,
    rain_market_id: row.rain_market_id,
  };
}

function winProbabilityFromElo(
  redElo: number | null | undefined,
  blueElo: number | null | undefined
): WinProbability {
  const red = redElo ?? 1500;
  const blue = blueElo ?? 1500;
  return eloWinProbability(red, blue);
}

function mapMatchup(row: DbMatchup): Bout {
  const red = row.red_fighter ? mapFighter(row.red_fighter, "Red") : null;
  const blue = row.blue_fighter ? mapFighter(row.blue_fighter, "Blue") : null;
  const marketRow = firstRelation(row.prediction_markets);
  const market = mapMarket(marketRow, row.id);

  const redCorner =
    red ??
    ({
      original_name: "TBD",
      display_name: "TBD",
      full_name: null,
      nickname: null,
      tapology_search_term: "TBD",
      research_notes: null,
      canonical_name: null,
      fighter_id: null,
      is_matched: false,
      is_debut: false,
      match_score: 0,
      record: null,
      record_display: null,
      weight_class: row.weight_class,
      gym: null,
      city: null,
      country: null,
      tapology_url: "#",
      tapology: { search_url: "#", profile_url: null },
      profiles: { tapology: null, sherdog: null },
      status: "suggested",
    } satisfies Fighter);

  const blueCorner =
    blue ??
    ({
      ...redCorner,
      original_name: "TBD",
      display_name: "TBD",
      tapology_search_term: "TBD",
    } satisfies Fighter);

  const debutNames = [redCorner, blueCorner]
    .filter((f) => f.is_debut)
    .map((f) => f.display_name);

  const summary: BoutSummary = {
    both_fighters_matched: redCorner.is_matched && blueCorner.is_matched,
    has_debut_fighter: debutNames.length > 0,
    debut_fighters: debutNames,
  };

  const implied =
    marketRow?.red_implied_prob != null && marketRow?.blue_implied_prob != null
      ? {
          red: Math.round(Number(marketRow.red_implied_prob)),
          blue: Math.round(Number(marketRow.blue_implied_prob)),
        }
      : winProbabilityFromElo(redCorner.elo, blueCorner.elo);

  return {
    bout_number: row.bout_order,
    label: boutLabel(row.bout_order),
    weight_class: row.weight_class ?? redCorner.weight_class ?? "—",
    level: boutLevel(row.red_fighter, row.blue_fighter),
    is_title_fight: row.is_title_fight,
    notes: null,
    win_probability: implied,
    red_corner: redCorner,
    blue_corner: blueCorner,
    summary,
    matchup_id: row.id,
    red_elo: row.red_fighter?.elo ?? null,
    blue_elo: row.blue_fighter?.elo ?? null,
    market,
  };
}

export function mapEventToInfo(event: DbEvent): EventInfo {
  const promoter = firstRelation(event.promoters);
  const locationParts = [event.city, event.country].filter(Boolean);
  return {
    name: event.name,
    date: event.event_date ?? "",
    promotion: promoter?.name ?? "PXF",
    location: locationParts.join(", ") || (promoter?.region ?? ""),
    venue: event.venue ?? undefined,
  };
}

export function mapToFightCard(
  event: DbEvent,
  matchups: DbMatchup[],
  metadata?: Partial<FightCard["metadata"]>
): FightCard {
  const bouts = matchups
    .slice()
    .sort((a, b) => a.bout_order - b.bout_order)
    .map(mapMatchup);

  const matchedFighters = new Set<string>();
  let debuts = 0;
  for (const bout of bouts) {
    for (const fighter of [bout.red_corner, bout.blue_corner]) {
      if (fighter.fighter_id) matchedFighters.add(fighter.fighter_id);
      if (fighter.is_debut) debuts += 1;
    }
  }

  return {
    event: mapEventToInfo(event),
    bouts,
    metadata: {
      processed_at: new Date().toISOString(),
      version: "pxf-db",
      total_bouts: bouts.length,
      matched_fighters: matchedFighters.size,
      debut_fighters: debuts,
      unmatched_names: [],
      match_threshold: 85,
      ...metadata,
    },
  };
}

export { DEFAULT_EVENT_SLUG };
