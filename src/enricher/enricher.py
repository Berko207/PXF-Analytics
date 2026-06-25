"""Core fight card enrichment pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.enricher.card_parser import RawBout, RawCorner, RawFightCard, parse_fight_card
from src.enricher.fighters_db import FighterRecord
from src.enricher.name_matcher import MatchResult, NameMatcher
from src.utils.normalize import strip_debut_marker
from src.utils.sherdog import build_fighter_url as build_sherdog_url
from src.utils.tapology import build_fighter_url, build_search_url


def _tapology_search_name(registry: FighterRecord | None, display_name: str) -> str:
    """Build a Tapology-friendly search term (full name + city when needed)."""
    search_name = (registry.get("full_name") if registry else None) or display_name
    if registry and " " not in search_name.strip():
        city = registry.get("city")
        if city:
            search_name = f"{search_name} {city}"
    return search_name


def _format_record(record: dict[str, int] | None) -> str | None:
    """Format wins-losses-draws record string."""
    if not record:
        return None
    wins = record.get("wins", 0)
    losses = record.get("losses", 0)
    draws = record.get("draws", 0)
    nc = record.get("nc", 0)
    base = f"{wins}-{losses}-{draws}"
    return f"{base} ({nc} NC)" if nc else base


def enrich_fighter(
    raw_name: str,
    *,
    marked_debut: bool = False,
    matcher: NameMatcher | None = None,
) -> dict[str, Any]:
    """Enrich a single fighter name from a fight card.

    Performs fuzzy matching against the registry, detects debut status,
    and attaches Tapology lookup links.

    Args:
        raw_name: Name as printed on the card (may include ``(debut)``).
        marked_debut: Whether the card explicitly marked this fighter as debuting.
        matcher: Optional shared NameMatcher instance.

    Returns:
        Enriched fighter dictionary with match metadata and links.
    """
    matcher = matcher or NameMatcher()
    cleaned_name, debut_from_marker = strip_debut_marker(raw_name)
    match: MatchResult = matcher.match(cleaned_name)

    display_name = cleaned_name
    registry: FighterRecord | None = match.fighter

    if registry:
        display_name = registry.get("full_name") or registry["canonical_name"]

    record = registry.get("record") if registry else None
    has_known_record = record is not None
    total_fights = (
        sum(record.get(key, 0) for key in ("wins", "losses", "draws", "nc"))
        if has_known_record
        else 0
    )

    # A debut requires a *known* empty record. An unknown record (``None``) means
    # the fighter is unverified, not necessarily debuting.
    is_debut = marked_debut or debut_from_marker or (
        match.is_match and has_known_record and total_fights == 0
    )
    is_matched = match.is_match

    tapology_slug = registry.get("tapology_slug") if registry else None
    tapology_profile = build_fighter_url(tapology_slug)
    sherdog_slug = registry.get("sherdog_slug") if registry else None
    sherdog_profile = build_sherdog_url(sherdog_slug)
    tapology_search_term = _tapology_search_name(registry, display_name)
    tapology_search = build_search_url(tapology_search_term)

    return {
        "input_name": raw_name.strip(),
        "display_name": display_name,
        "full_name": registry.get("full_name") if registry else None,
        "nickname": registry.get("nickname") if registry else None,
        "canonical_name": registry["canonical_name"] if registry else None,
        "tapology_search_term": tapology_search_term,
        "research_notes": registry.get("notes") if registry else None,
        "fighter_id": registry["id"] if registry else None,
        "is_matched": is_matched,
        "is_debut": is_debut,
        "match_score": round(match.score, 2),
        "record": registry.get("record") if registry else None,
        "record_display": _format_record(registry.get("record") if registry else None),
        "weight_class": registry.get("weight_class") if registry else None,
        "gym": registry.get("gym") if registry else None,
        "city": registry.get("city") if registry else None,
        "country": registry.get("country") if registry else None,
        "tapology": {
            "search_url": tapology_search,
            "profile_url": tapology_profile,
        },
        "profiles": {
            "tapology": tapology_profile or tapology_search,
            "sherdog": sherdog_profile,
        },
        "status": "matched" if is_matched else "unmatched",
    }


def enrich_bout(
    bout: RawBout,
    *,
    matcher: NameMatcher | None = None,
) -> dict[str, Any]:
    """Enrich a parsed bout with matched fighter data.

    Args:
        bout: Raw bout from the text parser.
        matcher: Optional shared NameMatcher instance.

    Returns:
        Enriched bout dictionary including both corners.
    """
    matcher = matcher or NameMatcher()

    red = enrich_fighter(
        bout.red.name,
        marked_debut=bout.red.marked_debut,
        matcher=matcher,
    )
    blue = enrich_fighter(
        bout.blue.name,
        marked_debut=bout.blue.marked_debut,
        matcher=matcher,
    )

    both_matched = red["is_matched"] and blue["is_matched"]
    has_debut = red["is_debut"] or blue["is_debut"]

    return {
        "bout_number": bout.bout_number,
        "label": bout.label,
        "weight_class": bout.weight_class,
        "level": bout.level,
        "is_title_fight": bout.is_title_fight,
        "notes": bout.notes,
        "red_corner": red,
        "blue_corner": blue,
        "summary": {
            "both_fighters_matched": both_matched,
            "has_debut_fighter": has_debut,
            "debut_fighters": [
                corner["display_name"]
                for corner in (red, blue)
                if corner["is_debut"]
            ],
        },
    }


def enrich_fight_card(
    card: RawFightCard | str,
    *,
    matcher: NameMatcher | None = None,
    match_threshold: float = 82.0,
) -> dict[str, Any]:
    """Enrich a full fight card and produce structured JSON-ready output.

    Args:
        card: Parsed RawFightCard or plain-text card string.
        matcher: Optional NameMatcher; created from ``match_threshold`` if omitted.
        match_threshold: Fuzzy match cutoff when building a new matcher.

    Returns:
        Fully enriched event dictionary with metadata and bout list.
    """
    parsed = parse_fight_card(card) if isinstance(card, str) else card
    matcher = matcher or NameMatcher(threshold=match_threshold)

    enriched_bouts = [enrich_bout(bout, matcher=matcher) for bout in parsed.bouts]

    matched_count = sum(
        1
        for bout in enriched_bouts
        for corner in (bout["red_corner"], bout["blue_corner"])
        if corner["is_matched"]
    )
    debut_count = sum(
        1
        for bout in enriched_bouts
        for corner in (bout["red_corner"], bout["blue_corner"])
        if corner["is_debut"]
    )
    unmatched_names = sorted(
        {
            corner["input_name"]
            for bout in enriched_bouts
            for corner in (bout["red_corner"], bout["blue_corner"])
            if not corner["is_matched"]
        }
    )

    return {
        "event": {
            "name": parsed.event_name,
            "date": parsed.event_date,
            "promotion": parsed.promotion,
            "location": parsed.location,
            "venue": parsed.venue,
            "stream_url": parsed.stream_url,
        },
        "bouts": enriched_bouts,
        "metadata": {
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "version": "0.1.0",
            "total_bouts": len(enriched_bouts),
            "matched_fighters": matched_count,
            "debut_fighters": debut_count,
            "unmatched_names": unmatched_names,
            "match_threshold": match_threshold,
        },
    }
