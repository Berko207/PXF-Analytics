# PXF Analytics — Web Dashboard

Professional Next.js dashboard for PXF fight card analytics, win probabilities, and promoter-facing insights.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Radix components)
- **Recharts** (probability gauges & odds charts)

## Quick Start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — event header, stats, bout table |
| `/fight-card` | Full card grid with Tapology links & status badges |
| `/analytics` | Polymarket-style gauges, card probabilities, odds movement |

## Data Source

The dashboard reads from `src/data/pxf50_card.json` (mirrors `../data/processed/pxf50_card.json` from the Python pipeline).

To refresh after re-processing a card:

```bash
cp ../data/processed/pxf50_card.json src/data/pxf50_card.json
```

Later phases will replace this with an API or file watcher.

## Project Structure

```
web/
├── src/
│   ├── app/              # Routes (dashboard, fight-card, analytics)
│   ├── components/
│   │   ├── charts/       # Recharts visualizations
│   │   ├── dashboard/    # Stats, tables, event header
│   │   ├── fight-card/   # Bout cards, badges
│   │   ├── fighters/     # Detail sheet, head-to-head
│   │   ├── layout/       # App shell, navigation
│   │   └── ui/           # shadcn primitives
│   ├── data/             # Static JSON (v0.1)
│   ├── lib/              # Data loaders, stats, chart helpers
│   └── types/            # TypeScript interfaces
├── package.json
└── tailwind.config.ts
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Features (MVP)

- Dark theme with PXF amber accent
- Event overview stats (bouts, pro/amateur, debuts, title fights)
- Fighter status badges: **Matched**, **Suggested**, **Debut**
- Tapology links on every fighter
- Click any fighter → detail sheet + head-to-head comparison
- **3 chart types:**
  1. Semi-circular win probability gauge (main event)
  2. Stacked bout probability bar chart (full card)
  3. Odds movement line chart (placeholder fight-week data)

## Next Steps

- Connect to Python pipeline via API or file sync
- Real win probability model (replace placeholder data)
- Fighter profile pages (`/fighters/[id]`)
- Promoter export (PDF / share links)
- Live results ingestion

See the root [README](../README.md) and [ROADMAP](../docs/ROADMAP.md) for the full platform vision.
