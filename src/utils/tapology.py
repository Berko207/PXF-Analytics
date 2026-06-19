"""Tapology URL builders for fighter lookup and verification."""

from __future__ import annotations

from urllib.parse import quote_plus


TAPOLOGY_BASE = "https://www.tapology.com"
TAPOLOGY_SEARCH = f"{TAPOLOGY_BASE}/search"


def build_search_url(name: str) -> str:
    """Build a Tapology search URL for a fighter name.

    Args:
        name: Fighter name to look up.

    Returns:
        Full Tapology search URL with the name as the query term.
    """
    return f"{TAPOLOGY_SEARCH}?term={quote_plus(name.strip())}"


def build_fighter_url(slug: str | None) -> str | None:
    """Build a direct Tapology fighter profile URL when a slug is known.

    Args:
        slug: Tapology fighter slug (e.g. ``juan-garzon-12345``).

    Returns:
        Profile URL, or ``None`` if no slug is available.
    """
    if not slug:
        return None
    return f"{TAPOLOGY_BASE}/fightcenter/fighters/{slug.strip('/')}"
