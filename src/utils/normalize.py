"""String normalization helpers for consistent name matching."""

from __future__ import annotations

import unicodedata


def normalize_name(name: str) -> str:
    """Normalize a fighter name for fuzzy comparison.

    Strips accents, lowercases, and collapses whitespace so variants like
    ``Garzón`` and ``Garzon`` compare equally during matching.

    Args:
        name: Raw fighter name from a card or database entry.

    Returns:
        Normalized string suitable for fuzzy matching.
    """
    decomposed = unicodedata.normalize("NFKD", name.strip())
    without_accents = "".join(
        char for char in decomposed if not unicodedata.combining(char)
    )
    return " ".join(without_accents.lower().split())


def strip_debut_marker(name: str) -> tuple[str, bool]:
    """Remove debut annotations from a fighter name.

    Supports common card notations such as ``(debut)`` or ``*debut*``.

    Args:
        name: Fighter name possibly containing a debut marker.

    Returns:
        Tuple of cleaned name and whether a debut marker was found.
    """
    lowered = name.lower()
    markers = ("(debut)", "[debut]", "*debut*", " debut")

    for marker in markers:
        if marker in lowered:
            cleaned = name
            for variant in ("(debut)", "[debut]", "*debut*", " debut", " Debut"):
                cleaned = cleaned.replace(variant, "")
            return cleaned.strip(" -–—"), True

    return name.strip(), False
