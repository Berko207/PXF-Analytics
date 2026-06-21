"""Sherdog URL builders for fighter profile lookup."""

from __future__ import annotations

SHERDOG_BASE = "https://www.sherdog.com"


def build_fighter_url(slug: str | None) -> str | None:
    """Build a Sherdog fighter profile URL when a slug is known.

    Args:
        slug: Sherdog fighter slug (e.g. ``Daniel-Lugo-317851``).

    Returns:
        Profile URL, or ``None`` if no slug is available.
    """
    if not slug:
        return None
    return f"{SHERDOG_BASE}/fighter/{slug.strip('/')}"
