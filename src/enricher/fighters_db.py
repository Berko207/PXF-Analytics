"""Extensible fighter database for PXF Analytics."""

from __future__ import annotations

from typing import Any, TypedDict

# Sentinel distinguishing "record omitted" (assume a 0-0-0 debut record) from an
# explicit ``record=None`` (record genuinely unknown / unverified — renders as "—").
_RECORD_UNSET: Any = object()


class FighterRecord(TypedDict, total=False):
    id: str
    canonical_name: str
    full_name: str | None
    nickname: str | None
    aliases: list[str]
    tapology_slug: str | None
    sherdog_slug: str | None
    record: dict[str, int] | None
    weight_class: str | None
    gym: str | None
    city: str | None
    country: str | None
    notes: str | None


def _f(
    id: str,
    name: str,
    *,
    full_name: str | None = None,
    nickname: str | None = None,
    aliases: list[str] | None = None,
    record: dict[str, int] | None = _RECORD_UNSET,
    weight_class: str | None = None,
    gym: str | None = None,
    city: str = "Hermosillo",
    country: str = "Mexico",
    slug: str | None = None,
    sherdog_slug: str | None = None,
    notes: str | None = None,
) -> FighterRecord:
    return {
        "id": id,
        "canonical_name": name,
        "full_name": full_name,
        "nickname": nickname,
        "aliases": aliases or [],
        "tapology_slug": slug,
        "sherdog_slug": sherdog_slug,
        "record": (
            {"wins": 0, "losses": 0, "draws": 0, "nc": 0}
            if record is _RECORD_UNSET
            else record
        ),
        "weight_class": weight_class,
        "gym": gym,
        "city": city,
        "country": country,
        "notes": notes,
    }


# PXF 50 official poster roster (July 4 · Arena Sonora)
# Profile fields sourced from Tapology/Sherdog/regional press where available.
FIGHTER_DATABASE: list[FighterRecord] = [
    # --- Main Card (PRO) ---
    _f(
        "lugo",
        "Lugo",
        full_name="Daniel Vicente Lugo Valdez",
        nickname="Super",
        aliases=["LUGO", "Daniel Lugo", "Daniel Super Lugo"],
        record={"wins": 3, "losses": 2, "draws": 0, "nc": 0},
        weight_class="135 lb",
        gym="Team Cuates Paez",
        city="Hermosillo",
        sherdog_slug="Daniel-Lugo-317851",
        notes="Sherdog pro record verified through PXF 49 (Mar 2026).",
    ),
    _f(
        "juan-garzon",
        "Garzón",
        full_name="Alex Garzon Gutierrez",
        aliases=["Garzon", "Garzón", "GARZON", "GARZÓN", "Juan Garzon", "Alex Garzon"],
        record={"wins": 1, "losses": 5, "draws": 0, "nc": 0},
        weight_class="135 lb",
        gym="Spartan Warriors Cabo San Lucas",
        city="La Paz",
        slug="342124-alex-garzon-gutierrez",
        notes="Tapology profile matched; verify identity vs poster.",
    ),
    _f(
        "carrera",
        "Carrera",
        aliases=["CARRERA"],
        record=None,
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "duarte",
        "Duarte",
        full_name="Humberto Duarte",
        nickname="Moso",
        aliases=["DUARTE", "Humberto Duarte"],
        record={"wins": 5, "losses": 7, "draws": 0, "nc": 0},
        weight_class="145 lb",
        gym="Apex MMA",
        city="Tucson",
        country="United States",
        slug="41498-humberto-duarte",
        sherdog_slug="Humberto-Duarte-124399",
        notes="Tapology and Sherdog profiles confirmed.",
    ),
    _f(
        "figueroa",
        "Figueroa",
        full_name="Manuel de Jesus Figueroa",
        nickname="Bobby",
        aliases=["FIGUEROA", "Manuel Figueroa", "La Bestia"],
        record={"wins": 0, "losses": 1, "draws": 0, "nc": 0},
        weight_class="140 lb",
        gym="Rival MMA",
        slug="366790-manuel-figueroa",
        sherdog_slug="Manuel-Figueroa-417879",
        notes="Tapology and Sherdog profiles confirmed.",
    ),
    _f(
        "carlos-linebaugh",
        "Linebaugh",
        full_name="Carlos Linebaugh",
        aliases=["Linebough", "LINEBOUGH", "Linebaugh", "Carlos Linebaugh"],
        record=None,
        weight_class="140 lb",
        gym="Obregon MMA",
        city="Ciudad Obregón",
        notes="Poster spelling 'Linebough'; no confirmed public MMA profile found.",
    ),
    _f(
        "arroyo",
        "Arroyo",
        aliases=["ARROYO"],
        record=None,
        weight_class="140 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "bailey",
        "Bailey",
        aliases=["BAILEY"],
        record=None,
        weight_class="140 lb",
        city="Nogales",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "gutierrez",
        "Gutiérrez",
        aliases=["Gutierrez", "GUTIERREZ", "GUTIÉRREZ"],
        record=None,
        weight_class="125 lb",
        notes="Common surname; no confirmed public MMA profile found.",
    ),
    _f(
        "borja",
        "Borja",
        aliases=["BORJA"],
        record=None,
        weight_class="125 lb",
        notes="No confirmed public MMA profile found.",
    ),
    # --- Preliminary Card (AMATEUR) ---
    _f(
        "morales",
        "Morales",
        full_name="Daniel Morales",
        nickname="Cirujano",
        aliases=["MORALES", "Daniel Morales"],
        record={"wins": 2, "losses": 0, "draws": 0, "nc": 0},
        weight_class="150 lb",
        gym="Guaymas Fight Lab",
        city="Guaymas",
        slug="552561-daniel-morales",
        sherdog_slug="Daniel-Morales-493347",
        notes="Tapology and Sherdog profiles confirmed.",
    ),
    _f(
        "gonzalez",
        "González",
        aliases=["Gonzalez", "GONZÁLEZ", "GONZALEZ"],
        weight_class="135 lb",
        notes="Two González entries on poster; no confirmed public MMA profile found.",
    ),
    _f(
        "lopez",
        "López",
        aliases=["Lopez", "LÓPEZ", "LOPEZ"],
        weight_class="135 lb",
        gym="Sonora Fight Team",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "acuna",
        "Acuña",
        aliases=["Acuna", "ACUÑA", "ACUNA"],
        weight_class="135 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "pavon",
        "Pavón",
        aliases=["Pavon", "PAVÓN", "PAVON"],
        weight_class="135 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "navarrete",
        "Navarrete",
        full_name="Sergio Navarrete",
        aliases=["NAVARRETE"],
        record=None,
        weight_class="120 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "rodriguez",
        "Rodríguez",
        aliases=["Rodriguez", "RODRÍGUEZ", "RODRIGUEZ"],
        weight_class="120 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "sotelo",
        "Sotelo",
        aliases=["SOTELO"],
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "cordova",
        "Córdova",
        aliases=["Cordova", "CORDOVA"],
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "silva",
        "Silva",
        aliases=["SILVA"],
        weight_class="125 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "miguel-rosenthal",
        "Rosenthal",
        full_name="Miguel Rosenthal",
        aliases=["Resenthal", "RESENTHAL", "Rosenthal", "Miguel Rosenthal"],
        weight_class="125 lb",
        city="Nogales",
        notes="Poster spelling 'Resenthal'; no confirmed public MMA profile found.",
    ),
    _f(
        "canez",
        "Cáñez",
        full_name="Luis Cañez",
        aliases=["Canez", "CÁÑEZ", "CANEZ", "Luis Canez"],
        record={"wins": 1, "losses": 0, "draws": 0, "nc": 0},
        weight_class="145 lb",
        slug="552606-luis-canez",
        notes="Tapology profile confirmed.",
    ),
    _f(
        "baca",
        "Baca",
        aliases=["BACA"],
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "chavira",
        "Chavira",
        aliases=["CHAVIRA"],
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
    _f(
        "escobar",
        "Escobar",
        aliases=["ESCOBAR"],
        weight_class="145 lb",
        notes="No confirmed public MMA profile found.",
    ),
]


def get_fighter_database() -> list[FighterRecord]:
    return FIGHTER_DATABASE
