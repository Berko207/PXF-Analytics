-- =============================================================================
-- pxf.seed_initial_ratings() — prior ratings from aggregate record
-- =============================================================================
-- Until pxf.fight_history is populated (then a per-bout replay refines these),
-- this sets each fighter's PRIOR rating + uncertainty from their aggregate
-- record. Glicko-style: rating (elo) + deviation (elo_uncertainty / RD).
--
-- Design:
--   * elo  = 1500, tilted by level, net record, and win quality; clamped.
--   * RD   = high when we have little/no data (debutants, unknown records),
--            shrinking with experience. Unknown record (NULL) stays max-RD so
--            the model never overtrusts a fighter we know nothing about.
-- Idempotent: recomputes elo/RD every run; writes one 'initial' rating_history
-- row per fighter (skips if one already exists, preserving later bout updates).
-- =============================================================================

create or replace function pxf.seed_initial_ratings()
returns integer
language plpgsql
security definer
set search_path = pxf, public
as $$
declare
  r        record;
  v_known  boolean;
  v_total  int;
  v_decided int;
  v_net    int;
  v_winrate numeric;
  v_elo    numeric;
  v_rd     numeric;
  v_count  int := 0;
begin
  for r in select * from pxf.fighters loop
    v_known   := (r.wins is not null or r.losses is not null);
    v_total   := coalesce(r.wins,0) + coalesce(r.losses,0)
               + coalesce(r.draws,0) + coalesce(r.no_contests,0);
    v_decided := coalesce(r.wins,0) + coalesce(r.losses,0);
    v_net     := coalesce(r.wins,0) - coalesce(r.losses,0);
    v_winrate := case when v_decided > 0
                      then coalesce(r.wins,0)::numeric / v_decided
                      else 0.5 end;

    -- Rating prior: base + level + net-record tilt + win-quality tilt, clamped.
    v_elo := 1500
           + case when r.pro_status = 'pro' then 40 else 0 end
           + least(8, greatest(-8, v_net)) * 20        -- ±160 from net record
           + (v_winrate - 0.5) * 200;                  -- ±100 from win quality
    v_elo := least(1850, greatest(1250, v_elo));

    -- Deviation: max when unknown/debut, shrinking ~30 per recorded fight.
    v_rd := case when (not v_known) or v_total = 0
                 then 350
                 else greatest(90, 350 - 30 * v_total) end;

    update pxf.fighters
       set elo = round(v_elo), elo_uncertainty = round(v_rd)
     where id = r.id;

    if not exists (
      select 1 from pxf.rating_history
       where fighter_id = r.id and reason = 'initial'
    ) then
      insert into pxf.rating_history
        (fighter_id, elo_before, elo_after, uncertainty_before, uncertainty_after, delta, reason)
      values
        (r.id, null, round(v_elo), null, round(v_rd), null, 'initial');
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
