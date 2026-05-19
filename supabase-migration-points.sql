-- ============================================================
-- PallEx Check — Driver Points System Migration
-- Run in: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

-- ── point_events table ────────────────────────────────────────
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

-- Driver sees only own events
create policy "point_events: driver select own"
  on public.point_events for select
  using ( auth.uid() = driver_id );

-- Admin sees all
create policy "point_events: admin select all"
  on public.point_events for select
  using ( public.is_admin() );

-- Only admin inserts manual events; auto-events use security definer functions
create policy "point_events: admin insert"
  on public.point_events for insert
  with check ( public.is_admin() );

create policy "point_events: admin delete"
  on public.point_events for delete
  using ( public.is_admin() );

-- ── Helper: total points for a driver ────────────────────────
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

-- ── Leaderboard view ──────────────────────────────────────────
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

-- ── Auto-award points on checklist submit ─────────────────────
create or replace function public.award_checklist_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_safety_ok boolean;
  v_total     integer := 10; -- base points for submission
begin
  -- Only fire when status changes TO 'submitted'
  if NEW.status = 'submitted' and (OLD.status is null or OLD.status <> 'submitted') then

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

    -- +5 bonus for perfect safety
    if v_safety_ok then
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
        when v_safety_ok then 'Checklist complet + siguranță perfectă'
        else 'Checklist trimis'
      end,
      'checklist',
      NEW.id
    );

  end if;
  return NEW;
end;
$$;

drop trigger if exists award_points_on_submit on public.checklists;
create trigger award_points_on_submit
  after update on public.checklists
  for each row execute function public.award_checklist_points();
