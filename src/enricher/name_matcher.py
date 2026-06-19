"""Fuzzy fighter name matching with alias support."""

from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz, process

from src.enricher.fighters_db import FighterRecord, get_fighter_database
from src.utils.normalize import normalize_name


@dataclass(frozen=True)
class MatchResult:
    """Outcome of a fuzzy name lookup against the fighter registry."""

    fighter: FighterRecord | None
    matched_name: str | None
    score: float
    is_match: bool
    input_name: str


class NameMatcher:
    """Match raw card names to canonical fighter records using rapidfuzz.

    Compares against each fighter's canonical name and all known aliases.
    Normalization handles accent differences (e.g. Garzón vs Garzon).

    Args:
        database: Optional fighter list; defaults to the project registry.
        threshold: Minimum score (0–100) to accept a match.
    """

    def __init__(
        self,
        database: list[FighterRecord] | None = None,
        *,
        threshold: float = 82.0,
    ) -> None:
        self._database = database if database is not None else get_fighter_database()
        self._threshold = threshold
        self._choices = self._build_choice_map()

    def _build_choice_map(self) -> dict[str, FighterRecord]:
        """Map every searchable name variant to its fighter record."""
        choices: dict[str, FighterRecord] = {}
        for fighter in self._database:
            names = [fighter["canonical_name"], *fighter.get("aliases", [])]
            for name in names:
                choices[normalize_name(name)] = fighter
        return choices

    def match(self, raw_name: str) -> MatchResult:
        """Find the best registry match for a raw fighter name.

        Args:
            raw_name: Name as it appears on a fight card.

        Returns:
            MatchResult with fighter data when score meets threshold.
        """
        normalized_input = normalize_name(raw_name)
        if not normalized_input:
            return MatchResult(
                fighter=None,
                matched_name=None,
                score=0.0,
                is_match=False,
                input_name=raw_name,
            )

        if normalized_input in self._choices:
            fighter = self._choices[normalized_input]
            return MatchResult(
                fighter=fighter,
                matched_name=fighter["canonical_name"],
                score=100.0,
                is_match=True,
                input_name=raw_name,
            )

        result = process.extractOne(
            normalized_input,
            self._choices.keys(),
            scorer=fuzz.WRatio,
        )

        if result is None:
            return MatchResult(
                fighter=None,
                matched_name=None,
                score=0.0,
                is_match=False,
                input_name=raw_name,
            )

        matched_key, score, _ = result
        fighter = self._choices[matched_key]
        is_match = score >= self._threshold

        return MatchResult(
            fighter=fighter if is_match else None,
            matched_name=fighter["canonical_name"] if is_match else None,
            score=float(score),
            is_match=is_match,
            input_name=raw_name,
        )
