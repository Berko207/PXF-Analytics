/** TypeScript interfaces mirroring enriched PXF fight card JSON. */

export type FighterStatus = "matched" | "suggested" | "debut";

export type BoutLevel = "PRO" | "AMATEUR";

export interface FighterRecord {
  wins: number;
  losses: number;
  draws: number;
  nc: number;
}

export interface TapologyLinks {
  search_url: string;
  profile_url: string | null;
}

export interface Fighter {
  original_name: string;
  display_name: string;
  full_name: string | null;
  tapology_search_term: string;
  canonical_name: string | null;
  fighter_id: string | null;
  is_matched: boolean;
  is_debut: boolean;
  match_score: number;
  record: FighterRecord | null;
  record_display: string | null;
  weight_class: string | null;
  gym: string | null;
  city: string | null;
  country: string | null;
  tapology_url: string;
  tapology: TapologyLinks;
  status: FighterStatus;
}

export interface WinProbability {
  red: number;
  blue: number;
}

export interface BoutSummary {
  both_fighters_matched: boolean;
  has_debut_fighter: boolean;
  debut_fighters: string[];
}

export interface Bout {
  bout_number: number;
  label: string;
  weight_class: string;
  level: BoutLevel;
  is_title_fight: boolean;
  notes: string | null;
  win_probability: WinProbability;
  red_corner: Fighter;
  blue_corner: Fighter;
  summary: BoutSummary;
}

export interface EventInfo {
  name: string;
  date: string;
  promotion: string;
  location: string;
  venue?: string;
  stream_url?: string;
}

export interface CardMetadata {
  processed_at: string;
  version: string;
  total_bouts: number;
  matched_fighters: number;
  debut_fighters: number;
  unmatched_names: string[];
  match_threshold: number;
}

export interface FightCard {
  event: EventInfo;
  bouts: Bout[];
  metadata: CardMetadata;
}

export interface EventStats {
  totalBouts: number;
  proBouts: number;
  amateurBouts: number;
  titleFights: number;
  debuts: number;
  matchedFighters: number;
  unmatchedNames: string[];
}
