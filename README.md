# PXF Analytics

A production-oriented data and analytics platform for local MMA promotions in
Sonora, Mexico — starting with **PXF (Premier Xtreme Fighting)**. Version 0.1
focuses on Python-based fight card enrichment: fuzzy fighter matching, Tapology
links, debut detection, and clean structured JSON output ready for a future
Next.js dashboard.

---

## Vision

PXF Analytics helps regional promoters:

- **Manage fight cards** — parse text cards, match fighters, flag debuts
- **Present professional analysis** — structured data promoters can trust and share
- **Scale into a full platform** — JSON today, Polymarket-style probability
  gauges and odds charts in a Next.js dashboard tomorrow

Long term, the platform will support fighter stats, head-to-head comparisons,
promoter-friendly exports, and optional betting integration (Azuro or custom).

---

## Current Status

| Feature | Status |
|---------|--------|
| Text fight card parser | ✅ |
| Fuzzy name matching (`rapidfuzz`) | ✅ |
| Alias / misspelling support | ✅ |
| Tapology search links | ✅ |
| Debut detection | ✅ |
| Structured JSON output | ✅ |
| CLI processor | ✅ |
| Web dashboard (Next.js MVP) | ✅ |
| Live API / backend | 🔜 Phase 2 |

---

## Project Structure

```
PXF-Analytics/
├── README.md
├── requirements.txt
├── web/                      # Next.js dashboard (see web/README.md)
├── src/
│   ├── enricher/
│   │   ├── enricher.py       # enrich_fighter(), enrich_bout(), enrich_fight_card()
│   │   ├── name_matcher.py   # rapidfuzz matching with aliases
│   │   ├── card_parser.py    # text → raw bout structures
│   │   └── fighters_db.py    # extensible fighter registry
│   └── utils/
│       ├── normalize.py      # accent-insensitive name normalization
│       ├── tapology.py       # URL builders
│       └── json_io.py        # JSON read/write
├── scripts/
│   └── process_card.py       # CLI entry point
├── data/
│   ├── processed/            # enriched JSON output
│   └── samples/              # sample fight cards
├── docs/
│   └── ROADMAP.md            # phased development plan
└── assets/                   # logos, posters (future)
```

---

## Web Dashboard

The Next.js dashboard lives in `web/` and reads from `web/src/data/pxf50_card.json`.

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Pages:** Dashboard (`/`), Fight Card (`/fight-card`), Analytics (`/analytics`)

After re-processing a card with Python, sync the JSON:

```bash
cp data/processed/pxf50_card.json web/src/data/pxf50_card.json
```

Full dashboard docs: [web/README.md](web/README.md)

---

## Quick Start (Python)

### 1. Clone and enter the project

```bash
cd ~/PXF-Analytics
```

### 2. Create a virtual environment (recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate   # macOS / Linux
# .venv\Scripts\activate    # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Process the sample fight card

```bash
python scripts/process_card.py
```

This reads `data/samples/pxf_sample_card.txt` and writes enriched JSON to
`data/processed/pxf_sample_card_enriched.json`.

### 5. Process a custom card

```bash
python scripts/process_card.py \
  --input path/to/your_card.txt \
  --output data/processed/my_event_enriched.json \
  --threshold 82
```

---

## Fight Card Text Format

Plain-text cards use a simple, human-readable layout:

```text
PXF 12 - Noche de Campeones
Date: 2025-06-19
Location: Hermosillo, Sonora, Mexico
Promotion: PXF

Main Event - Lightweight (title)
Red: Juan Garzon
Blue: Carlos Linebough

Co-Main - Welterweight
Red: Miguel Resenthal
Blue: Diego Martinez (debut)
```

**Supported features:**

- Event metadata (`Date`, `Location`, `Promotion`)
- Bout labels (`Main Event`, `Co-Main`, numbered bouts)
- Weight classes and title fight markers `(title)`
- Corner lines (`Red:` / `Blue:`)
- Debut markers `(debut)` on fighter names

---

## Output Schema

Each enriched card produces JSON with three top-level sections:

```json
{
  "event": { "name", "date", "promotion", "location" },
  "bouts": [ /* enriched bout objects */ ],
  "metadata": {
    "processed_at",
    "matched_fighters",
    "debut_fighters",
    "unmatched_names",
    "match_threshold"
  }
}
```

Each fighter includes:

- `display_name`, `canonical_name`, `fighter_id`
- `is_matched`, `is_debut`, `match_score`
- `record`, `gym`, `city`
- `tapology.search_url` and `tapology.profile_url` (when slug known)

---

## Extending the Fighter Database

Edit `src/enricher/fighters_db.py` to add fighters or aliases. Each entry
supports:

```python
{
    "id": "unique-slug",
    "canonical_name": "Full Name",
    "aliases": ["Misspelling", "Nickname"],
    "tapology_slug": "tapology-slug-or-none",
    "record": {"wins": 0, "losses": 0, "draws": 0, "nc": 0},
    "weight_class": "Lightweight",
    "gym": "Gym Name",
    "city": "Hermosillo",
    "country": "Mexico",
}
```

In Phase 1 this registry moves to `data/fighters.json` without changing the
enricher API.

---

## Python API

```python
from src.enricher.enricher import enrich_fight_card

card_text = open("data/samples/pxf_sample_card.txt").read()
result = enrich_fight_card(card_text, match_threshold=82.0)

print(result["metadata"]["matched_fighters"])
print(result["bouts"][0]["red_corner"]["tapology"]["search_url"])
```

Individual functions for granular use:

```python
from src.enricher.enricher import enrich_fighter, enrich_bout
from src.enricher.name_matcher import NameMatcher

matcher = NameMatcher(threshold=82.0)
fighter = enrich_fighter("Carlos Linebough", matcher=matcher)
# → matches "Carlos Linebaugh" at high confidence
```

---

## Sample Card Highlights

The included sample deliberately uses common misspellings to demonstrate fuzzy
matching:

| Card name | Matched to |
|-----------|------------|
| Juan Garzon | Juan Garzón |
| Carlos Linebough | Carlos Linebaugh |
| Miguel Resenthal | Miguel Rosenthal |
| Jorge Herera | Jorge Herrera |

Debut fighters (`Diego Martinez`, `Patricia Morales`) are flagged even when
matched to registry entries with 0-0 records or explicit `(debut)` markers.

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full phased plan:

1. **v0.2** — JSON fighter DB, CSV imports, basic stats
2. **v0.3** — ~~Next.js dashboard MVP~~ ✅ Dashboard MVP shipped
3. **v0.4** — Polymarket-style charts and probability gauges (Recharts) — in progress
4. **v0.5+** — Live results, betting integration (Azuro)

---

## Development

```bash
# Run with custom threshold (lower = more permissive matching)
python scripts/process_card.py --threshold 75

# Type hints throughout; Python 3.10+ recommended
python --version
```

---

## License

Private / internal tool for PXF and Sonora regional promotions. License TBD.

---

Built for promoters who care about clean data and professional presentation.
