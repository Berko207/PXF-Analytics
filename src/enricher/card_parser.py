"""Parse text-based fight cards into a raw structured format."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class RawCorner:
    """One fighter slot on a bout before enrichment."""

    name: str
    marked_debut: bool = False


@dataclass
class RawBout:
    """Parsed bout before fighter matching."""

    bout_number: int
    label: str
    weight_class: str | None
    level: str | None = None
    red: RawCorner = field(default_factory=lambda: RawCorner(name=""))
    blue: RawCorner = field(default_factory=lambda: RawCorner(name=""))
    is_title_fight: bool = False
    notes: str | None = None


@dataclass
class RawFightCard:
    """Parsed fight card metadata and bout list."""

    event_name: str
    event_date: str | None = None
    promotion: str = "PXF"
    location: str | None = None
    venue: str | None = None
    stream_url: str | None = None
    bouts: list[RawBout] = field(default_factory=list)


_HEADER_PATTERNS = {
    "date": re.compile(r"^date\s*:\s*(.+)$", re.IGNORECASE),
    "location": re.compile(r"^location\s*:\s*(.+)$", re.IGNORECASE),
    "promotion": re.compile(r"^promotion\s*:\s*(.+)$", re.IGNORECASE),
    "venue": re.compile(r"^venue\s*:\s*(.+)$", re.IGNORECASE),
    "stream": re.compile(r"^stream\s*:\s*(.+)$", re.IGNORECASE),
}

_BOUT_HEADER = re.compile(
    r"^(?:(?P<number>\d+)\.\s*)?"
    r"(?:(?P<label>main event|co-main(?: event)?|featured bout|preliminary bout|"
    r"amateur bout|opening bout)\s*[-–—]\s*)?"
    r"(?P<weight>.+?)"
    r"(?P<title>\s*\(title\))?\s*$",
    re.IGNORECASE,
)


def parse_weight_and_level(raw: str | None) -> tuple[str | None, str | None]:
    """Extract weight class text and PRO/AMATEUR level from a bout header segment."""
    if not raw:
        return None, None

    text = raw.strip()
    level: str | None = None
    if re.search(r"\bAMATEUR\b", text, re.IGNORECASE):
        level = "AMATEUR"
    elif re.search(r"\bPRO\b", text, re.IGNORECASE):
        level = "PRO"

    lb_match = re.search(r"(\d+)\s*lb", text, re.IGNORECASE)
    if lb_match:
        weight_class = f"{lb_match.group(1)} lb"
    else:
        weight_class = re.sub(r"\b(MMA|PRO|AMATEUR)\b", "", text, flags=re.IGNORECASE)
        weight_class = " ".join(weight_class.split()) or None

    return weight_class, level

_CORNER_LINE = re.compile(
    r"^(red|blue)\s*:\s*(.+)$",
    re.IGNORECASE,
)


def _match_bout_header(line: str) -> re.Match[str] | None:
    """Return bout header match, ignoring metadata-looking lines."""
    match = _BOUT_HEADER.match(line)
    if not match:
        return None

    weight = match.group("weight") or ""
    label = match.group("label")

    if label:
        return match
    if re.search(r"\d+\s*lb", weight, re.IGNORECASE):
        return match
    return None


def parse_fight_card(text: str) -> RawFightCard:
    """Parse a plain-text fight card into raw bout structures.

    Expected format (flexible):

        PXF 12 - Hermosillo
        Date: 2025-06-19
        Location: Hermosillo, Sonora, Mexico

        Main Event - Lightweight
        Red: Juan Garzon
        Blue: Carlos Linebough

        2. Co-Main - Welterweight
        Red: Miguel Resenthal
        Blue: Diego Martinez (debut)

    Args:
        text: Full fight card as plain text.

    Returns:
        RawFightCard ready for enrichment.
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        raise ValueError("Fight card text is empty.")

    event_name = lines[0]
    card = RawFightCard(event_name=event_name)

    index = 1
    while index < len(lines):
        header_match = _HEADER_PATTERNS["date"].match(lines[index])
        if header_match:
            card.event_date = header_match.group(1).strip()
            index += 1
            continue

        header_match = _HEADER_PATTERNS["location"].match(lines[index])
        if header_match:
            card.location = header_match.group(1).strip()
            index += 1
            continue

        header_match = _HEADER_PATTERNS["promotion"].match(lines[index])
        if header_match:
            card.promotion = header_match.group(1).strip()
            index += 1
            continue

        header_match = _HEADER_PATTERNS["venue"].match(lines[index])
        if header_match:
            card.venue = header_match.group(1).strip()
            index += 1
            continue

        header_match = _HEADER_PATTERNS["stream"].match(lines[index])
        if header_match:
            card.stream_url = header_match.group(1).strip()
            index += 1
            continue

        break

    bout_number = 0
    while index < len(lines):
        bout_header = _match_bout_header(lines[index])
        if not bout_header:
            index += 1
            continue

        bout_number += 1
        explicit_number = bout_header.group("number")
        number = int(explicit_number) if explicit_number else bout_number

        label = (bout_header.group("label") or f"Bout {number}").strip().title()
        weight_class, level = parse_weight_and_level(bout_header.group("weight"))
        is_title = bool(bout_header.group("title"))

        index += 1
        red: RawCorner | None = None
        blue: RawCorner | None = None
        notes: list[str] = []

        while index < len(lines):
            if _match_bout_header(lines[index]):
                break

            corner_match = _CORNER_LINE.match(lines[index])
            if corner_match:
                side, name = corner_match.group(1).lower(), corner_match.group(2).strip()
                marked_debut = "(debut)" in name.lower()
                corner = RawCorner(name=name, marked_debut=marked_debut)
                if side == "red":
                    red = corner
                else:
                    blue = corner
                index += 1
                continue

            notes.append(lines[index])
            index += 1

        if red is None or blue is None:
            raise ValueError(
                f"Bout '{label}' is missing red or blue corner (found at line {index})."
            )

        card.bouts.append(
            RawBout(
                bout_number=number,
                label=label,
                weight_class=weight_class,
                level=level,
                red=red,
                blue=blue,
                is_title_fight=is_title,
                notes=" ".join(notes) if notes else None,
            )
        )

    if not card.bouts:
        raise ValueError("No bouts found in fight card text.")

    return card


def raw_card_to_dict(card: RawFightCard) -> dict[str, Any]:
    """Serialize a RawFightCard for debugging or intermediate storage."""
    return {
        "event_name": card.event_name,
        "event_date": card.event_date,
        "promotion": card.promotion,
        "location": card.location,
        "bouts": [
            {
                "bout_number": bout.bout_number,
                "label": bout.label,
                "weight_class": bout.weight_class,
                "is_title_fight": bout.is_title_fight,
                "notes": bout.notes,
                "red": {"name": bout.red.name, "marked_debut": bout.red.marked_debut},
                "blue": {"name": bout.blue.name, "marked_debut": bout.blue.marked_debut},
            }
            for bout in card.bouts
        ],
    }
