/** Format an ISO date string for display (e.g. "Aug 15, 2025"). */
export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Primary label: full name when known, otherwise display name. */
export function getFighterDisplayName(fighter: {
  display_name: string;
  full_name?: string | null;
}): string {
  return fighter.full_name ?? fighter.display_name;
}

/** Tapology query term (full name + city fallback for single-word names). */
export function getTapologySearchTerm(fighter: {
  display_name: string;
  full_name?: string | null;
  tapology_search_term?: string;
}): string {
  return fighter.tapology_search_term ?? getFighterDisplayName(fighter);
}

/** Return Tapology URL, preferring profile over search. */
export function getTapologyHref(fighter: {
  tapology_url: string;
  tapology: { profile_url: string | null; search_url: string };
}): string {
  return fighter.tapology.profile_url ?? fighter.tapology_url ?? fighter.tapology.search_url;
}
