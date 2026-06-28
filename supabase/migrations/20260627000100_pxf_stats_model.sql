-- =============================================================================
-- PXF — stats model hardening (schema: pxf)
-- =============================================================================
-- Adds the inputs a credible MMA rating/prediction model needs: physical
-- attributes, finish breakdown, activity, and a per-fighter career history to
-- rate from. Also adds market-prep columns to prediction_markets and clears the
-- mutable-search_path lint on pxf.set_updated_at. Isolated to the pxf schema —
-- the shared public.* trading bot is untouched.
-- =============================================================================

-- Fighting stance ------------------------------------------------------------
do $$ begin
  create type pxf.stance as enum ('orthodox','southpaw','switch');
exception when duplicate_object then null; end $$;

-- Fighter model attributes ---------------------------------------------------
-- Physicals + activity. NULL means "unknown" (NOT zero) — the model guards on
-- null and degrades gracefully, honoring the no-fabrication data rule.
alter table pxf.fighters add column if not exists height_cm      numeric;
alter table pxf.fighters add column if not exists reach_cm       numeric;
alter table pxf.fighters add column if not exists stance         pxf.stance;
alter table pxf.fighters add column if not exists last_fight_date date;

-- Finish breakdown (sub-counts of wins/losses). NULL = unknown split.
alter table pxf.fighters add column if not exists wins_ko    int;
alter table pxf.fighters add column if not exists wins_sub   int;
alter table pxf.fighters add column if not exists wins_dec   int;
alter table pxf.fighters add column if not exists losses_ko  int;
alter table pxf.fighters add column if not exists losses_sub int;
alter table pxf.fighters add column if not exists losses_dec int;

-- Career fight history (external bouts), the source for ELO replay + finish ----
-- rates. Distinct from on-platform matchups/results. source/source_url are
-- provenance-only (no bios/training-partner notes).
create table if not exists pxf.fight_history (
  id                  uuid primary key default gen_random_uuid(),
  fighter_id          uuid not null references pxf.fighters(id) on delete cascade,
  opponent_name       text,
  opponent_fighter_id uuid references pxf.fighters(id) on delete set null,
  event_name          text,
  fight_date          date,
  result              text check (result in ('win','loss','draw','nc')),
  method              pxf.result_method,
  round               int,
  time                text,
  is_title_fight      boolean not null default false,
  weight_class        text,
  source              text,
  source_url          text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_fight_history_fighter on pxf.fight_history(fighter_id);
create index if not exists idx_fight_history_date    on pxf.fight_history(fight_date);
create index if not exists idx_fighters_last_fight   on pxf.fighters(last_fight_date);

-- Market-prep columns on prediction_markets ----------------------------------
-- red_implied_prob / blue_implied_prob hold the MODEL's seed probabilities.
-- market_config holds the exact Rain create params (question, options,
-- barValues, baseToken, tokenDecimals, seedLiquidity, start/end).
alter table pxf.prediction_markets add column if not exists model_confidence numeric;
alter table pxf.prediction_markets add column if not exists model_version    text;
alter table pxf.prediction_markets add column if not exists market_config    jsonb not null default '{}'::jsonb;

-- RLS for the new table (public read + staff write, matching the schema) ------
alter table pxf.fight_history enable row level security;
drop policy if exists fight_history_public_read on pxf.fight_history;
create policy fight_history_public_read on pxf.fight_history for select using (true);
drop policy if exists fight_history_staff_write on pxf.fight_history;
create policy fight_history_staff_write on pxf.fight_history for all
  using (public.is_staff()) with check (public.is_staff());

grant all on pxf.fight_history to anon, authenticated, service_role;

-- Security lint: pin search_path on the updated_at trigger helper -------------
alter function pxf.set_updated_at() set search_path = pxf, public;
