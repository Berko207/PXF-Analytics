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
  - `20260625000050_auth_profiles.sql` — **auth/profiles** (`public.profiles`,
    roles `fan|promoter|admin`, RLS, signup trigger, `is_admin`). Backfilled from
    live (already applied remotely under earlier version names); dated before the
    pxf schema since pxf depends on it. Idempotent — safe but unnecessary to re-run.
  - `20260625000100_pxf_schema_init.sql` — the canonical data model.
  - `20260625000200_fighters_seed_prep.sql` — nullable records + idempotency keys.
  - `20260627000100_pxf_stats_model.sql` — physicals, finish breakdown,
    `last_fight_date`, `fight_history`, market-prep columns on
    `prediction_markets`, `set_updated_at` search_path fix.
  - `20260627000200_seed_initial_ratings.sql` — `pxf.seed_initial_ratings()`
    (prior Elo + RD from aggregate record). Run once after seeding fighters:
    `select pxf.seed_initial_ratings();`

## Expose the `pxf` schema to the API — DONE (2026-06-27)

PostgREST (and therefore `supabase-js`) only serves schemas on the allow-list.
`pxf` is now exposed — without this the app silently falls back to static JSON
(`PGRST106: Invalid schema: pxf`). Two ways to set it:

- **Dashboard → Project Settings → API → Exposed schemas → add `pxf` → save**, or
- the SQL used here (reproducible, e.g. for a fresh project):
  ```sql
  alter role authenticator set pgrst.db_schemas = 'public, graphql_public, pxf';
  notify pgrst, 'reload config';
  notify pgrst, 'reload schema';
  ```

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
                                          │                     │  ├─ fighter_contacts (staff-only)
                                          │                     │  ├─< fight_history (external career bouts)
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
