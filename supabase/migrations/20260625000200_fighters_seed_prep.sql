-- Prep the pxf schema for seeding real card data.

-- A fighter's record may be UNKNOWN. NULL (no public record found) is NOT the
-- same as a 0-0-0 debut. Honors the rule: never fabricate an unverified record.
alter table pxf.fighters
  alter column wins        drop default, alter column wins        drop not null,
  alter column losses      drop default, alter column losses      drop not null,
  alter column draws       drop default, alter column draws       drop not null,
  alter column no_contests drop default, alter column no_contests drop not null;

-- Stable external key (enrichment pipeline canonical id) for idempotent re-sync,
-- plus fighter hometown (valuable for a regional promotion).
alter table pxf.fighters add column if not exists slug    text unique;
alter table pxf.fighters add column if not exists city    text;
alter table pxf.fighters add column if not exists country text;

-- Natural keys so the seed is idempotent (safe to re-run).
do $$ begin
  alter table pxf.events add constraint events_slug_key unique (slug);
exception when duplicate_object then null; when duplicate_table then null; end $$;
do $$ begin
  alter table pxf.fight_cards add constraint fight_cards_event_name_key unique (event_id, name);
exception when duplicate_object then null; when duplicate_table then null; end $$;
do $$ begin
  alter table pxf.matchups add constraint matchups_card_order_key unique (fight_card_id, bout_order);
exception when duplicate_object then null; when duplicate_table then null; end $$;
do $$ begin
  alter table pxf.fighter_source_records add constraint fsr_fighter_source_key unique (fighter_id, source);
exception when duplicate_object then null; when duplicate_table then null; end $$;
