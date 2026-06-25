# Supabase — PXF Analytics

This project shares one Supabase project (**poly-db**, ref `kfbcotavcrueqryodjqy`)
with other tooling. To stay isolated, **all PXF domain tables live in the `pxf`
schema**; auth/profiles live in `public`.

## Migrations

- `migrations/` is the source of truth for schema. Apply with the Supabase CLI:
  ```bash
  supabase db push        # applies pending migrations to the linked project
  ```
- Migrations applied so far:
  - **auth/profiles** (`public.profiles`, roles `fan|promoter|admin`, RLS,
    signup trigger) — applied live on the Supabase-auth branch / PR #4.
    > TODO: backfill this as a tracked migration file on the auth branch.
  - `20260625000100_pxf_schema_init.sql` — the canonical data model (this branch).

## ⚠️ Required manual step — expose the `pxf` schema to the API

PostgREST (and therefore `supabase-js`) only serves schemas on the allow-list.
After the migration, add `pxf`:

**Dashboard → Project Settings → API → Exposed schemas → add `pxf` → save.**

Then query it from the client with:

```ts
const supabase = createClient();
const { data } = await supabase.schema("pxf").from("events").select("*");
```

## Schema overview

```
promoters ─┐
           └─ events ──< fight_cards ──< matchups ──< results
                                          │  ├─ red_fighter_id ─┐
                                          │  └─ blue_fighter_id ┤
                                          │                     ▼
                                          │                  fighters ──< rating_history
                                          │                     │  └─ fighter_contacts (staff-only)
                                          │                     └─< fighter_source_records (raw imports)
                                          └─< prediction_markets ──< orders_trades
                                                     └─ settlements ─ results
audit_logs (cross-cutting)
```

Key principles:
- **Source vs canonical:** `fighter_source_records` (raw imports) stay separate
  from `fighters` (verified canonical) so data can be reconciled/re-synced/audited.
- **Lifecycle gate:** `events.status` drives everything; Rain markets are only
  created from `approved` onward.
- **Provenance:** `fighters.field_status` (jsonb) tags each field as
  `verified | imported | manual | missing`.
- **Onchain is indexed, not authoritative:** `orders_trades` mirrors chain data.

## RLS summary

- Public read / staff write: `promoters, events, fight_cards, fighters,
  matchups, rating_history, prediction_markets, orders_trades, results`.
- Staff only: `fighter_contacts, fighter_source_records, settlements, audit_logs`.
- "Staff" = `public.is_staff()` (role `promoter` or `admin`). `service_role`
  bypasses RLS for trusted server code.
