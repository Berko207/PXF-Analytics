-- =============================================================================
-- Auth / profiles — role-based user records (fan | promoter | admin)
-- =============================================================================
-- BACKFILL of objects already live on remote (applied there under versions
-- 20260625190822 / 20260625211252). Re-created here, dated BEFORE the pxf
-- schema (…000100), because pxf_schema_init depends on public.profiles and the
-- role helpers. Reconstructed verbatim from the live database; every statement
-- is idempotent, so re-running is a no-op. Do NOT re-apply to remote (would
-- create duplicate migration rows) — this exists so fresh `supabase db push`
-- and local setups have auth before the pxf domain schema.
-- =============================================================================

-- Profiles: one row per auth user, created automatically on sign-up. -----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'fan' check (role in ('fan','promoter','admin')),
  created_at timestamptz not null default now()
);

-- Auto-provision a profile when a new auth user is created. --------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'fan')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helper. is_staff()/is_promoter() are (re)defined in pxf_schema_init. ----
-- SECURITY DEFINER + fixed search_path so the policy never recurses through RLS.
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS: a user sees their own profile; admins see/write all. --------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using ((auth.uid() = id) or public.is_admin());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
