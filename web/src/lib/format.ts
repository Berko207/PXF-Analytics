/** Format an ISO date string for display (e.g. "Aug 15, 2025"). */
export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Return Tapology URL, preferring profile over search. */
export function getTapologyHref(fighter: {
  tapology_url: string;
  tapology: { profile_url: string | null; search_url: string };
}): string {
  return fighter.tapology.profile_url ?? fighter.tapology_url ?? fighter.tapology.search_url;
}
