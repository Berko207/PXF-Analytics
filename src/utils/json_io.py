"""JSON read/write helpers for enriched fight card output."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_json(data: dict[str, Any], path: Path, *, indent: int = 2) -> None:
    """Write structured data to a JSON file, creating parent dirs if needed.

    Args:
        data: Serializable dictionary to persist.
        path: Destination file path.
        indent: JSON indentation level for human-readable output.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=indent, ensure_ascii=False)
        handle.write("\n")


def read_json(path: Path) -> dict[str, Any]:
    """Load a JSON file into a dictionary.

    Args:
        path: Source file path.

    Returns:
        Parsed JSON content.
    """
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)
