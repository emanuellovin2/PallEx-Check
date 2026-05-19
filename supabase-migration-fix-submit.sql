-- ============================================================
-- PallEx Check — Fix: Checklist Submit Trigger
-- Problema: award_checklist_points() nu are bloc EXCEPTION,
-- dacă inserarea în point_events eșuează (permisii/alt motiv),
-- întregul UPDATE al checklist-ului este anulat.
-- Fix: wrap în EXCEPTION + setăm ownership la postgres.
-- ============================================================
-- Run în: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

-- Step 1: Ensure point_events table exists (run points migration first if missing)
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

-- Recreate policies idempotently
drop policy if exists "point_events: driver select own"  on public.point_events;
drop policy if exists "point_events: admin select all"   on public.point_events;
drop policy if exists "point_events: admin insert"       on public.point_events;
drop policy if exists "point_events: admin delete"       on public.point_events;
drop policy if exists "point_events: trigger insert"     on public.point_events;

create policy "point_events: driver select own"
  on public.point_events for select
  using ( auth.uid() = driver_id );

create policy "point_events: admin select all"
  on public.point_events for select
  using ( public.is_admin() );

create policy "point_events: admin insert"
  on public.point_events for insert
  with check ( public.is_admin() );

-- Allow trigger-based auto-inserts (SECURITY DEFINER function covers this,
-- but this policy ensures it works even if SECURITY DEFINER is insufficient)
create policy "point_events: trigger insert"
  on public.point_events for insert
  with check (
    -- Automatic checklist points: driver must own the referenced checklist
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

-- Step 2: Leaderboard view
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

-- Step 3: Rewrite trigger function with bulletproof EXCEPTION handling
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
  -- Only fire when status changes TO 'submitted'
  if NEW.status = 'submitted' and (OLD.status is null or OLD.status <> 'submitted') then

    -- Wrap everything in an exception block so a failure here
    -- NEVER aborts the checklist submission.
    begin

      -- Check if all safety items passed
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

      -- +5 bonus for perfect safety check
      if v_safety_ok = true then
        v_total := v_total + 5;
      end if;

      -- +3 bonus for reporting damage honestly
      if exists (
        select 1 from public.checklist_checks
        where checklist_id = NEW.id and has_damage = true
      ) then
        v_total := v_total + 3;
      end if;

      -- Insert the point event
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
      -- Points awarding failed — log silently, do NOT abort the submit
      null;
    end;

  end if;
  return NEW;

exception when others then
  -- Outer safety net: trigger must never abort a checklist submission
  return NEW;
end;
$$;

-- Ensure function is owned by postgres (superuser) so it bypasses RLS
alter function public.award_checklist_points() owner to postgres;

-- Recreate trigger
drop trigger if exists award_points_on_submit on public.checklists;
create trigger award_points_on_submit
  after update on public.checklists
  for each row execute function public.award_checklist_points();

-- Step 4: get_driver_points helper
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
