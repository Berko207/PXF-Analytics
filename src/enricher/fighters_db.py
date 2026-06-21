"""Extensible fighter database for PXF Analytics."""

from __future__ import annotations

from typing import TypedDict


class FighterRecord(TypedDict, total=False):
    id: str
    canonical_name: str
    full_name: str | None
    aliases: list[str]
    tapology_slug: str | None
    record: dict[str, int]
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
    aliases: list[str] | None = None,
    record: dict[str, int] | None = None,
    weight_class: str | None = None,
    gym: str | None = None,
    city: str = "Hermosillo",
    slug: str | None = None,
) -> FighterRecord:
    return {
        "id": id,
        "canonical_name": name,
        "full_name": full_name,
        "aliases": aliases or [],
        "tapology_slug": slug,
        "record": record or {"wins": 0, "losses": 0, "draws": 0, "nc": 0},
        "weight_class": weight_class,
        "gym": gym,
        "city": city,
        "country": "Mexico",
    }


# PXF 50 official poster roster (July 4 · Arena Sonora)
FIGHTER_DATABASE: list[FighterRecord] = [
    # --- Main Card (PRO) ---
    _f("lugo", "Lugo", full_name="Daniel Lugo", aliases=["LUGO", "Daniel Lugo"], record={"wins": 6, "losses": 2, "draws": 0, "nc": 0}, weight_class="135 lb"),
    _f("juan-garzon", "Juan Garzón", aliases=["Garzon", "Garzón", "GARZON", "GARZÓN"], record={"wins": 8, "losses": 2, "draws": 0, "nc": 0}, weight_class="135 lb", gym="Sonora Fight Team"),
    _f("carrera", "Carrera", aliases=["CARRERA"], record={"wins": 5, "losses": 2, "draws": 0, "nc": 0}, weight_class="145 lb"),
    _f("duarte", "Duarte", full_name="Humberto Duarte", aliases=["DUARTE", "Humberto Duarte"], record={"wins": 4, "losses": 3, "draws": 0, "nc": 0}, weight_class="145 lb"),
    _f("figueroa", "Figueroa", aliases=["FIGUEROA"], record={"wins": 7, "losses": 1, "draws": 0, "nc": 0}, weight_class="140 lb"),
    _f("carlos-linebaugh", "Carlos Linebaugh", aliases=["Linebough", "LINEBOUGH", "Linebaugh"], record={"wins": 6, "losses": 3, "draws": 0, "nc": 0}, weight_class="140 lb", gym="Obregon MMA", city="Ciudad Obregón"),
    _f("arroyo", "Arroyo", aliases=["ARROYO"], record={"wins": 5, "losses": 2, "draws": 0, "nc": 0}, weight_class="140 lb"),
    _f("bailey", "Bailey", aliases=["BAILEY"], record={"wins": 4, "losses": 1, "draws": 0, "nc": 0}, weight_class="140 lb", city="Nogales"),
    _f("gutierrez", "Gutiérrez", aliases=["Gutierrez", "GUTIERREZ", "GUTIÉRREZ"], record={"wins": 6, "losses": 1, "draws": 0, "nc": 0}, weight_class="125 lb"),
    _f("borja", "Borja", aliases=["BORJA"], record={"wins": 3, "losses": 2, "draws": 0, "nc": 0}, weight_class="125 lb"),
    # --- Preliminary Card (AMATEUR) ---
    _f("morales", "Morales", aliases=["MORALES"], weight_class="150 lb", gym="Guaymas Fight Lab", city="Guaymas"),
    _f("gonzalez", "González", aliases=["Gonzalez", "GONZÁLEZ", "GONZALEZ"], weight_class="135 lb"),
    _f("lopez", "López", aliases=["Lopez", "LÓPEZ", "LOPEZ"], weight_class="135 lb", gym="Sonora Fight Team"),
    _f("acuna", "Acuña", aliases=["Acuna", "ACUÑA", "ACUNA"], weight_class="135 lb"),
    _f("pavon", "Pavón", aliases=["Pavon", "PAVÓN", "PAVON"], weight_class="135 lb"),
    _f("navarrete", "Navarrete", aliases=["NAVARRETE"], weight_class="120 lb"),
    _f("rodriguez", "Rodríguez", aliases=["Rodriguez", "RODRÍGUEZ", "RODRIGUEZ"], weight_class="120 lb"),
    _f("sotelo", "Sotelo", aliases=["SOTELO"], weight_class="145 lb"),
    _f("cordova", "Córdova", aliases=["Cordova", "CORDOVA"], weight_class="145 lb"),
    _f("silva", "Silva", aliases=["SILVA"], weight_class="125 lb"),
    _f("miguel-rosenthal", "Miguel Rosenthal", aliases=["Resenthal", "RESENTHAL", "Rosenthal"], weight_class="125 lb", city="Nogales"),
    _f("canez", "Cáñez", aliases=["Canez", "CÁÑEZ", "CANEZ"], weight_class="145 lb"),
    _f("baca", "Baca", aliases=["BACA"], weight_class="145 lb"),
    _f("chavira", "Chavira", aliases=["CHAVIRA"], weight_class="145 lb"),
    _f("escobar", "Escobar", aliases=["ESCOBAR"], weight_class="145 lb"),
]


def get_fighter_database() -> list[FighterRecord]:
    return FIGHTER_DATABASE
