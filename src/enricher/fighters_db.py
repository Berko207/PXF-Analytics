"""Extensible fighter database for PXF Analytics.

This module holds the v0.1 in-memory fighter registry. Each entry can later
be migrated to ``data/fighters.json`` or a Postgres table without changing the
enricher API — only the loader needs to change.
"""

from __future__ import annotations

from typing import TypedDict


class FighterRecord(TypedDict, total=False):
    """Canonical fighter record stored in the registry."""

    id: str
    canonical_name: str
    aliases: list[str]
    tapology_slug: str | None
    record: dict[str, int]
    weight_class: str | None
    gym: str | None
    city: str | None
    country: str | None
    notes: str | None


# Seed database for PXF / Sonora regional scene.
# Aliases intentionally include common misspellings from local fight cards.
FIGHTER_DATABASE: list[FighterRecord] = [
    {
        "id": "juan-garzon",
        "canonical_name": "Juan Garzón",
        "aliases": ["Garzon", "J. Garzon", "Juan Garzon", "Garzón"],
        "tapology_slug": "juan-garzon-48291",
        "record": {"wins": 8, "losses": 2, "draws": 0, "nc": 0},
        "weight_class": "Lightweight",
        "gym": "Sonora Fight Team",
        "city": "Hermosillo",
        "country": "Mexico",
    },
    {
        "id": "carlos-linebaugh",
        "canonical_name": "Carlos Linebaugh",
        "aliases": ["Linebough", "C. Linebaugh", "Carlos Linebough"],
        "tapology_slug": "carlos-linebaugh-55102",
        "record": {"wins": 6, "losses": 3, "draws": 0, "nc": 0},
        "weight_class": "Lightweight",
        "gym": "Obregon MMA",
        "city": "Ciudad Obregón",
        "country": "Mexico",
    },
    {
        "id": "miguel-rosenthal",
        "canonical_name": "Miguel Rosenthal",
        "aliases": ["Resenthal", "M. Rosenthal", "Miguel Resenthal"],
        "tapology_slug": "miguel-rosenthal-60344",
        "record": {"wins": 5, "losses": 1, "draws": 0, "nc": 0},
        "weight_class": "Welterweight",
        "gym": "Tijuana Top Team",
        "city": "Nogales",
        "country": "Mexico",
    },
    {
        "id": "diego-martinez",
        "canonical_name": "Diego Martínez",
        "aliases": ["Diego Martinez", "D. Martinez"],
        "tapology_slug": None,
        "record": {"wins": 0, "losses": 0, "draws": 0, "nc": 0},
        "weight_class": "Welterweight",
        "gym": "Hermosillo Combat Club",
        "city": "Hermosillo",
        "country": "Mexico",
        "notes": "Regional amateur turning pro.",
    },
    {
        "id": "ana-lopez",
        "canonical_name": "Ana López",
        "aliases": ["Ana Lopez", "A. Lopez"],
        "tapology_slug": "ana-lopez-71203",
        "record": {"wins": 4, "losses": 0, "draws": 0, "nc": 0},
        "weight_class": "Strawweight",
        "gym": "Sonora Fight Team",
        "city": "Hermosillo",
        "country": "Mexico",
    },
    {
        "id": "patricia-morales",
        "canonical_name": "Patricia Morales",
        "aliases": ["P. Morales", "Paty Morales"],
        "tapology_slug": None,
        "record": {"wins": 0, "losses": 0, "draws": 0, "nc": 0},
        "weight_class": "Strawweight",
        "gym": "Guaymas Fight Lab",
        "city": "Guaymas",
        "country": "Mexico",
    },
    {
        "id": "ricardo-soto",
        "canonical_name": "Ricardo Soto",
        "aliases": ["R. Soto", "Ricky Soto"],
        "tapology_slug": "ricardo-soto-33421",
        "record": {"wins": 10, "losses": 4, "draws": 1, "nc": 0},
        "weight_class": "Middleweight",
        "gym": "Hermosillo Combat Club",
        "city": "Hermosillo",
        "country": "Mexico",
    },
    {
        "id": "jorge-herrera",
        "canonical_name": "Jorge Herrera",
        "aliases": ["J. Herrera", "Jorge Herera"],
        "tapology_slug": "jorge-herrera-29877",
        "record": {"wins": 7, "losses": 5, "draws": 0, "nc": 0},
        "weight_class": "Middleweight",
        "gym": "Culiacán Fight House",
        "city": "Navojoa",
        "country": "Mexico",
    },
]


def get_fighter_database() -> list[FighterRecord]:
    """Return the active fighter registry.

    Returns:
        List of fighter records. Swap this implementation later to load from
        JSON, SQLite, or Supabase without touching enricher logic.
    """
    return FIGHTER_DATABASE
