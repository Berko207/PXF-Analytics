#!/usr/bin/env python3
"""CLI entry point for processing text fight cards into enriched JSON."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.enricher.enricher import enrich_fight_card  # noqa: E402
from src.enricher.dashboard_export import to_dashboard_json  # noqa: E402
from src.utils.json_io import write_json  # noqa: E402


def _default_output_path(input_path: Path, output_dir: Path) -> Path:
    """Derive output filename from input stem."""
    return output_dir / f"{input_path.stem}_enriched.json"


def build_parser() -> argparse.ArgumentParser:
    """Configure CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Process a text fight card and save enriched JSON output.",
    )
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=PROJECT_ROOT / "data" / "samples" / "pxf_sample_card.txt",
        help="Path to plain-text fight card (default: sample card)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Output JSON path (default: data/processed/<input>_enriched.json)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PROJECT_ROOT / "data" / "processed",
        help="Directory for enriched JSON when --output is not set",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=82.0,
        help="Fuzzy match threshold 0-100 (default: 82)",
    )
    parser.add_argument(
        "--dashboard",
        action="store_true",
        help="Export dashboard-compatible JSON (for Next.js web app)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the fight card enrichment CLI."""
    args = build_parser().parse_args(argv)
    input_path: Path = args.input

    if not input_path.exists():
        print(f"Error: input file not found: {input_path}", file=sys.stderr)
        return 1

    card_text = input_path.read_text(encoding="utf-8")
    enriched = enrich_fight_card(card_text, match_threshold=args.threshold)

    if args.dashboard:
        payload = to_dashboard_json(
            enriched,
            venue=enriched["event"].get("venue"),
            stream_url=enriched["event"].get("stream_url"),
        )
    else:
        payload = enriched

    output_path = args.output or _default_output_path(input_path, args.output_dir)
    write_json(payload, output_path)

    meta = payload["metadata"]
    event = payload["event"]
    print(f"Processed: {event['name']}")
    print(f"  Bouts:           {meta['total_bouts']}")
    print(f"  Matched fighters:{meta['matched_fighters']}")
    print(f"  Debuts:          {meta['debut_fighters']}")
    if meta["unmatched_names"]:
        print(f"  Unmatched:       {', '.join(meta['unmatched_names'])}")
    print(f"Saved to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
