# PXF Analytics — Roadmap

This document outlines the planned evolution of PXF Analytics from a Python
enrichment toolkit (v0.1) to a full promoter-facing analytics platform.

---

## Phase 0 — Foundation (v0.1) ✅ Current

**Goal:** Reliable fight card ingestion and fighter matching for PXF events.

- [x] Text-based fight card parser
- [x] Fuzzy name matching with alias support (`rapidfuzz`)
- [x] Tapology search link generation
- [x] Debut vs matched fighter detection
- [x] Structured JSON output
- [x] CLI tool (`scripts/process_card.py`)
- [x] Extensible in-memory fighter registry

**Output:** Enriched JSON files in `data/processed/` ready for downstream tools.

---

## Phase 1 — Data Layer Expansion (v0.2)

**Goal:** Richer fighter profiles and reusable data storage.

- [ ] Migrate fighter registry to `data/fighters.json` with schema validation
- [ ] Add fighter CRUD scripts for promoters (add alias, update record)
- [ ] Support CSV / spreadsheet fight card imports
- [ ] Historical event archive (`data/events/`)
- [ ] Basic stats: finish rate, average fight time, weight-class history
- [ ] Export formats: CSV, PDF fight-night brief

---

## Phase 2 — Web Dashboard MVP (v0.3)

**Goal:** Professional promoter-facing UI built on enriched JSON.

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui

- [ ] Event overview page with fight card layout
- [ ] Fighter profile pages (record, gym, Tapology links)
- [ ] Head-to-head comparison view
- [ ] Search and filter across events and fighters
- [ ] REST or tRPC API reading from JSON / Supabase

---

## Phase 3 — Analytics & Visualizations (v0.4)

**Goal:** Polymarket-style insights that help promoters and fans understand matchups.

**Stack:** Recharts + custom probability components

- [ ] Win-probability gauges per bout (model-driven or manual odds input)
- [ ] Historical performance charts (striking, grappling when data available)
- [ ] Event-level analytics dashboard (debuts, regional rankings)
- [ ] Shareable matchup cards for social media
- [ ] Dark/light themes aligned with PXF branding

---

## Phase 4 — Live Event & Betting Integration (v0.5+)

**Goal:** Real-time event tools and optional wagering infrastructure.

- [ ] Live results ingestion and automatic record updates
- [ ] In-event probability shifts as rounds progress
- [ ] Integration with Azuro or custom prediction market contracts
- [ ] Promoter export packs (media kits, announcer scripts)
- [ ] Multi-promotion support beyond PXF (Sonora regional circuit)

---

## Technical Principles (All Phases)

1. **Separation of concerns** — Python enrichment, JSON schema, frontend are independent layers.
2. **Schema-first** — Define JSON contracts early so Python and Next.js evolve in parallel.
3. **Promoter trust** — Every matched name shows confidence score and Tapology link for verification.
4. **Incremental delivery** — Each phase ships usable value; no big-bang rewrite.

---

## Open Questions

- Primary data source beyond Tapology? (Sherdog, local commission records)
- Will PXF provide official post-event results via API or spreadsheet?
- Betting integration timeline and regulatory constraints in Mexico

---

*Last updated: June 2025 — v0.1 release*
