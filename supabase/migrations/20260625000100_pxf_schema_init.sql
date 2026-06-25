-- =============================================================================
-- PXF Analytics — canonical data model (schema: pxf)
-- =============================================================================
-- Promoter-first combat-sports platform. Keeps imported source data SEPARATE
-- from canonical records so everything can be reconciled / re-synced / audited.
--
-- Depends on the auth/profiles migration (public.profiles + public.is_admin),
-- which is shipped on the Supabase-auth branch / PR. Roles: fan|promoter|admin.
-- =============================================================================

create schema if not exists pxf;

-- -----------------------------------------------------------------------------
-- Role helpers (live in public, alongside profiles). SECURITY DEFINER so they
-- bypass RLS and never recurse through a policy.
-- -----------------------------------------------------------------------------
create or replace function public.is_promoter()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'promoter');
$$;

create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('promoter','admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  -- Event/card lifecycle. Markets may only be created from 'approved' onward.
  create type pxf.event_status as enum (
    'draft','approved','markets_created','trading_open',
    'completed','result_submitted','settled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- Per-field provenance status used in fighters.field_status (jsonb) values.
  create type pxf.field_status as enum ('verified','imported','manual','missing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pxf.pro_status as enum ('amateur','pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pxf.corner as enum ('red','blue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pxf.result_method as enum (
    'ko_tko','submission','decision','draw','no_contest','dq'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- Mirrors a Rain onchain market's lifecycle.
  create type pxf.market_status as enum (
    'pending','created','trading_open','closed','resolved','settled','cancelled'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function pxf.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Tables
-- =============================================================================

-- Promoters (promotions / organizations) -------------------------------------
create table if not exists pxf.promoters (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete set null,
  name        text not null,
  slug        text unique,
  region      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Events ----------------------------------------------------------------------
create table if not exists pxf.events (
  id           uuid primary key default gen_random_uuid(),
  promoter_id  uuid references pxf.promoters(id) on delete set null,
  name         text not null,
  slug         text,
  event_date   date,
  venue        text,
  city         text,
  country      text,
  status       pxf.event_status not null default 'draft',
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Fight cards (an event can have main card + prelims, etc.) --------------------
create table if not exists pxf.fight_cards (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references pxf.events(id) on delete cascade,
  name        text not null default 'Main Card',
  ordinal     int not null default 0,
  created_at  timestamptz not null default now()
);

-- Fighters (canonical, admin-verified) ----------------------------------------
-- NOTE: sensitive contact info is intentionally NOT here (see fighter_contacts)
-- because this table is publicly readable.
create table if not exists pxf.fighters (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  nickname      text,
  weight_class  text,
  gym           text,
  date_of_birth date,
  pro_status    pxf.pro_status,
  wins          int not null default 0,
  losses        int not null default 0,
  draws         int not null default 0,
  no_contests   int not null default 0,
  photo_url     text,
  tapology_url  text,
  elo           numeric,
  elo_uncertainty numeric,
  -- per-field provenance, e.g. {"gym":"manual","record":"imported"}; values
  -- are pxf.field_status members ('verified'|'imported'|'manual'|'missing').
  field_status  jsonb not null default '{}'::jsonb,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Sensitive fighter contact info (staff-only) ---------------------------------
create table if not exists pxf.fighter_contacts (
  fighter_id  uuid primary key references pxf.fighters(id) on delete cascade,
  email       text,
  phone       text,
  notes       text,
  updated_at  timestamptz not null default now()
);

-- Raw imported source records, kept SEPARATE from canonical fighters ----------
create table if not exists pxf.fighter_source_records (
  id               uuid primary key default gen_random_uuid(),
  fighter_id       uuid references pxf.fighters(id) on delete set null,
  source           text not null,            -- 'tapology' | 'sherdog' | 'manual' | ...
  source_url       text,
  source_ref       text,                     -- external id at the source
  payload          jsonb not null,           -- raw imported data
  match_confidence numeric,                  -- fuzzy-match score vs canonical
  reconciled       boolean not null default false,
  imported_at      timestamptz not null default now()
);

-- Matchups / bouts ------------------------------------------------------------
create table if not exists pxf.matchups (
  id               uuid primary key default gen_random_uuid(),
  fight_card_id    uuid not null references pxf.fight_cards(id) on delete cascade,
  event_id         uuid references pxf.events(id) on delete cascade,
  bout_order       int not null default 0,
  red_fighter_id   uuid references pxf.fighters(id) on delete set null,
  blue_fighter_id  uuid references pxf.fighters(id) on delete set null,
  weight_class     text,
  rounds           int not null default 3,
  is_title_fight   boolean not null default false,
  -- admin approves a bout before it can be mapped into a Rain market
  approved         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ELO rating history (one row per rating change) ------------------------------
create table if not exists pxf.rating_history (
  id                 uuid primary key default gen_random_uuid(),
  fighter_id         uuid not null references pxf.fighters(id) on delete cascade,
  matchup_id         uuid references pxf.matchups(id) on delete set null,
  elo_before         numeric,
  elo_after          numeric,
  uncertainty_before numeric,
  uncertainty_after  numeric,
  delta              numeric,
  reason             text,                   -- 'initial' | 'bout_result' | 'manual_adjust'
  created_at         timestamptz not null default now()
);

-- Prediction markets (mirror of a Rain onchain market) ------------------------
create table if not exists pxf.prediction_markets (
  id                uuid primary key default gen_random_uuid(),
  matchup_id        uuid not null references pxf.matchups(id) on delete cascade,
  rain_market_id    text,                    -- external Rain id (null until created)
  chain             text,
  contract_address  text,
  status            pxf.market_status not null default 'pending',
  red_implied_prob  numeric,
  blue_implied_prob numeric,
  opened_at         timestamptz,
  closed_at         timestamptz,
  resolved_at       timestamptz,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Orders/trades — INDEXED from chain, not source of truth ---------------------
create table if not exists pxf.orders_trades (
  id            uuid primary key default gen_random_uuid(),
  market_id     uuid not null references pxf.prediction_markets(id) on delete cascade,
  tx_hash       text,
  wallet_address text,
  outcome       pxf.corner,
  amount        numeric,
  price         numeric,
  occurred_at   timestamptz,
  raw           jsonb,
  created_at    timestamptz not null default now()
);

-- Results ---------------------------------------------------------------------
create table if not exists pxf.results (
  id                uuid primary key default gen_random_uuid(),
  matchup_id        uuid not null unique references pxf.matchups(id) on delete cascade,
  winner_fighter_id uuid references pxf.fighters(id) on delete set null,
  method            pxf.result_method,
  round             int,
  time              text,
  notes             text,
  submitted_by      uuid references auth.users(id) on delete set null,
  submitted_at      timestamptz not null default now()
);

-- Settlements (sync of Rain resolution back into the app) ---------------------
create table if not exists pxf.settlements (
  id                  uuid primary key default gen_random_uuid(),
  market_id           uuid not null references pxf.prediction_markets(id) on delete cascade,
  result_id           uuid references pxf.results(id) on delete set null,
  rain_resolution_ref text,
  status              text not null default 'pending', -- 'pending' | 'synced' | 'failed'
  raw                 jsonb,
  settled_at          timestamptz,
  created_at          timestamptz not null default now()
);

-- Audit log -------------------------------------------------------------------
create table if not exists pxf.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_events_promoter         on pxf.events(promoter_id);
create index if not exists idx_events_status           on pxf.events(status);
create index if not exists idx_fight_cards_event       on pxf.fight_cards(event_id);
create index if not exists idx_matchups_card           on pxf.matchups(fight_card_id);
create index if not exists idx_matchups_event          on pxf.matchups(event_id);
create index if not exists idx_matchups_red            on pxf.matchups(red_fighter_id);
create index if not exists idx_matchups_blue           on pxf.matchups(blue_fighter_id);
create index if not exists idx_fighters_full_name      on pxf.fighters(lower(full_name));
create index if not exists idx_source_records_fighter  on pxf.fighter_source_records(fighter_id);
create index if not exists idx_rating_history_fighter  on pxf.rating_history(fighter_id);
create index if not exists idx_markets_matchup         on pxf.prediction_markets(matchup_id);
create index if not exists idx_orders_market           on pxf.orders_trades(market_id);
create index if not exists idx_settlements_market      on pxf.settlements(market_id);
create index if not exists idx_audit_entity            on pxf.audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'promoters','events','fighters','fighter_contacts','matchups','prediction_markets'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on pxf.%I;
       create trigger set_updated_at before update on pxf.%I
         for each row execute function pxf.set_updated_at();', t, t);
  end loop;
end $$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Public-readable analytics tables: anyone may SELECT; only staff may write.
-- Internal tables (source records, contacts, settlements, audit): staff only.
-- service_role bypasses RLS entirely (used by trusted server code).
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'promoters','events','fight_cards','fighters','fighter_contacts',
    'fighter_source_records','matchups','rating_history','prediction_markets',
    'orders_trades','results','settlements','audit_logs'
  ] loop
    execute format('alter table pxf.%I enable row level security;', t);
  end loop;
end $$;

-- Public read + staff write ----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'promoters','events','fight_cards','fighters','matchups',
    'rating_history','prediction_markets','orders_trades','results'
  ] loop
    execute format($f$
      drop policy if exists "%1$s_public_read" on pxf.%1$I;
      create policy "%1$s_public_read" on pxf.%1$I for select using (true);
      drop policy if exists "%1$s_staff_write" on pxf.%1$I;
      create policy "%1$s_staff_write" on pxf.%1$I for all
        using (public.is_staff()) with check (public.is_staff());
    $f$, t);
  end loop;
end $$;

-- Staff-only (no public read) --------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'fighter_contacts','fighter_source_records','settlements','audit_logs'
  ] loop
    execute format($f$
      drop policy if exists "%1$s_staff_all" on pxf.%1$I;
      create policy "%1$s_staff_all" on pxf.%1$I for all
        using (public.is_staff()) with check (public.is_staff());
    $f$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Grants (Supabase convention: grant broadly, let RLS enforce access)
-- -----------------------------------------------------------------------------
grant usage on schema pxf to anon, authenticated, service_role;
grant all on all tables in schema pxf to anon, authenticated, service_role;
grant all on all sequences in schema pxf to anon, authenticated, service_role;
alter default privileges in schema pxf grant all on tables to anon, authenticated, service_role;
alter default privileges in schema pxf grant all on sequences to anon, authenticated, service_role;
