"""Convert enricher output to the Next.js dashboard JSON schema."""

from __future__ import annotations

from typing import Any


def _fighter_status(fighter: dict[str, Any]) -> str:
    """Map enricher fighter fields to dashboard status badges."""
    if fighter.get("is_debut"):
        return "debut"
    if not fighter.get("is_matched"):
        return "suggested"
    if fighter.get("match_score", 0) < 100:
        return "suggested"
    return "matched"


def _tapology_url(fighter: dict[str, Any]) -> str:
    tapology = fighter.get("tapology") or {}
    return tapology.get("profile_url") or tapology.get("search_url") or ""


def _estimate_win_probability(
    red: dict[str, Any],
    blue: dict[str, Any],
) -> dict[str, int]:
    """Simple record-based implied win probability (placeholder model)."""

    def win_score(fighter: dict[str, Any]) -> float:
        record = fighter.get("record") or {}
        wins = record.get("wins", 0)
        losses = record.get("losses", 0)
        if wins + losses == 0:
            return 0.0
        return wins - losses * 0.5

    red_score = win_score(red)
    blue_score = win_score(blue)
    total = abs(red_score) + abs(blue_score)

    if total == 0:
        return {"red": 50, "blue": 50}

    red_pct = round(50 + ((red_score - blue_score) / max(total, 1)) * 25)
    red_pct = max(35, min(75, red_pct))
    return {"red": red_pct, "blue": 100 - red_pct}


def _export_fighter(fighter: dict[str, Any]) -> dict[str, Any]:
    status = _fighter_status(fighter)
    return {
        "original_name": fighter["input_name"],
        "display_name": fighter["display_name"],
        "full_name": fighter.get("full_name"),
        "tapology_search_term": fighter.get("tapology_search_term", fighter["display_name"]),
        "canonical_name": fighter.get("canonical_name"),
        "fighter_id": fighter.get("fighter_id"),
        "is_matched": fighter.get("is_matched", False),
        "is_debut": fighter.get("is_debut", False),
        "match_score": fighter.get("match_score", 0),
        "record": fighter.get("record"),
        "record_display": fighter.get("record_display"),
        "weight_class": fighter.get("weight_class"),
        "gym": fighter.get("gym"),
        "city": fighter.get("city"),
        "country": fighter.get("country"),
        "tapology_url": _tapology_url(fighter),
        "tapology": fighter.get("tapology", {"search_url": "", "profile_url": None}),
        "status": status,
    }


def to_dashboard_json(
    enriched: dict[str, Any],
    *,
    venue: str | None = None,
    stream_url: str | None = None,
) -> dict[str, Any]:
    """Transform enricher output into the dashboard-compatible fight card JSON."""
    event = enriched["event"]
    bouts: list[dict[str, Any]] = []

    for bout in enriched["bouts"]:
        red = _export_fighter(bout["red_corner"])
        blue = _export_fighter(bout["blue_corner"])
        bouts.append(
            {
                "bout_number": bout["bout_number"],
                "label": bout["label"],
                "weight_class": bout.get("weight_class") or "TBD",
                "level": bout.get("level") or "PRO",
                "is_title_fight": bout.get("is_title_fight", False),
                "notes": bout.get("notes"),
                "win_probability": _estimate_win_probability(red, blue),
                "red_corner": red,
                "blue_corner": blue,
                "summary": bout.get("summary", {}),
            }
        )

    return {
        "event": {
            "name": event["name"],
            "date": event.get("date"),
            "promotion": event.get("promotion", "PXF"),
            "location": event.get("location"),
            "venue": venue,
            "stream_url": stream_url,
        },
        "bouts": bouts,
        "metadata": {
            **enriched["metadata"],
            "version": "0.3.0",
            "source": "pxf50_official_poster",
        },
    }
