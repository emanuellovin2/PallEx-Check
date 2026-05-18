-- ============================================================
-- PallEx Check — Supabase Schema  (full rewrite)
-- Run once in: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────

do $$ begin
  create type public.app_role           as enum ('admin', 'driver');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.checklist_status   as enum ('draft', 'submitted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.photo_type         as enum ('front', 'back', 'side', 'damage', 'pre_check', 'post_check', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.incident_severity  as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.incident_status    as enum ('open', 'reviewing', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

-- ── 1. profiles ──────────────────────────────────────────────
-- Admin creates all users via Supabase Auth; trigger auto-inserts profile.

create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  role        public.app_role not null default 'driver',
  full_name   text        not null default '',
  email       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ── Admin helper (security definer → no recursive RLS) ───────
-- Defined AFTER profiles table so PostgreSQL can validate the function body.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drivers see only themselves; admins see everyone.
create policy "profiles: driver select own"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "profiles: admin select all"
  on public.profiles for select
  using ( public.is_admin() );

-- Only the auth trigger inserts a profile (on behalf of the new user).
create policy "profiles: insert own on signup"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Driver can update own non-privileged fields; admin can update anything.
create policy "profiles: driver update own"
  on public.profiles for update
  using ( auth.uid() = id and not public.is_admin() )
  with check ( auth.uid() = id );

create policy "profiles: admin update any"
  on public.profiles for update
  using ( public.is_admin() );

-- Only admin can delete a profile.
create policy "profiles: admin delete"
  on public.profiles for delete
  using ( public.is_admin() );

-- ── 2. vehicles ──────────────────────────────────────────────

create table if not exists public.vehicles (
  id                 uuid        primary key default uuid_generate_v4(),
  plate_number       text        not null unique,
  model              text        not null,
  assigned_driver_id uuid        references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.vehicles enable row level security;

-- Driver sees only their assigned vehicle; admin sees all.
create policy "vehicles: driver select assigned"
  on public.vehicles for select
  using ( assigned_driver_id = auth.uid() );

create policy "vehicles: admin select all"
  on public.vehicles for select
  using ( public.is_admin() );

-- Full write access for admin only.
create policy "vehicles: admin insert"
  on public.vehicles for insert
  with check ( public.is_admin() );

create policy "vehicles: admin update"
  on public.vehicles for update
  using ( public.is_admin() );

create policy "vehicles: admin delete"
  on public.vehicles for delete
  using ( public.is_admin() );

-- ── 3. checklists ────────────────────────────────────────────

create table if not exists public.checklists (
  id           uuid                    primary key default uuid_generate_v4(),
  driver_id    uuid                    not null references public.profiles (id) on delete cascade,
  vehicle_id   uuid                    not null references public.vehicles  (id) on delete restrict,
  gps_lat      numeric(10, 7),
  gps_lng      numeric(10, 7),
  created_at   timestamptz             not null default now(),
  submitted_at timestamptz,
  status       public.checklist_status not null default 'draft',
  locked       boolean                 not null default false,
  -- Consistency: once locked the submitted_at must be set.
  constraint chk_locked_requires_submitted
    check ( locked = false or submitted_at is not null )
);

alter table public.checklists enable row level security;

create policy "checklists: driver select own"
  on public.checklists for select
  using ( auth.uid() = driver_id );

create policy "checklists: admin select all"
  on public.checklists for select
  using ( public.is_admin() );

create policy "checklists: driver insert own"
  on public.checklists for insert
  with check ( auth.uid() = driver_id );

-- Drivers may only update while NOT locked.
create policy "checklists: driver update unlocked"
  on public.checklists for update
  using ( auth.uid() = driver_id and locked = false )
  with check ( auth.uid() = driver_id );

create policy "checklists: admin update any"
  on public.checklists for update
  using ( public.is_admin() );

create policy "checklists: admin delete"
  on public.checklists for delete
  using ( public.is_admin() );

-- ── 4. checklist_checks ──────────────────────────────────────
-- One row per checklist (unique constraint). All safety fields are nullable
-- booleans — NULL = not yet assessed.

create table if not exists public.checklist_checks (
  id              uuid        primary key default uuid_generate_v4(),
  checklist_id    uuid        not null references public.checklists (id) on delete cascade,

  -- Tyres
  tyre_front_left   boolean,
  tyre_front_right  boolean,
  tyre_rear_left    boolean,
  tyre_rear_right   boolean,
  tyre_spare        boolean,

  -- Lights
  headlights        boolean,
  taillights        boolean,
  indicators        boolean,
  hazard_lights     boolean,
  brake_lights      boolean,

  -- Brakes
  foot_brake        boolean,
  handbrake         boolean,

  -- Fluids
  engine_oil        boolean,
  coolant           boolean,
  brake_fluid       boolean,
  washer_fluid      boolean,
  fuel_level        boolean,

  -- Bodywork & Visibility
  windscreen        boolean,
  wipers            boolean,
  mirrors           boolean,
  doors_secure      boolean,

  -- Driver & Occupant Safety
  seatbelts         boolean,
  horn              boolean,

  -- Cargo
  cargo_secured     boolean,
  load_distribution boolean,
  pallet_condition  boolean,

  -- Emergency Equipment
  fire_extinguisher  boolean,
  first_aid_kit      boolean,
  warning_triangles  boolean,
  hi_vis_vest        boolean,

  -- Documents
  vehicle_registration boolean,
  insurance_docs       boolean,
  driver_licence       boolean,

  -- Free-text notes
  notes           text,

  -- Cargo details
  cargo_type      text,
  cargo_quantity  integer,
  cargo_notes     text,

  -- Damage report
  has_damage           boolean default false,
  damage_description   text,
  damage_voice_text    text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint one_check_per_checklist unique (checklist_id)
);

alter table public.checklist_checks enable row level security;

-- Access is inherited from the parent checklist.
create policy "checklist_checks: driver select own"
  on public.checklist_checks for select
  using (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_id and c.driver_id = auth.uid()
    )
  );

create policy "checklist_checks: admin select all"
  on public.checklist_checks for select
  using ( public.is_admin() );

create policy "checklist_checks: driver insert unlocked"
  on public.checklist_checks for insert
  with check (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_id
        and c.driver_id = auth.uid()
        and c.locked = false
    )
  );

create policy "checklist_checks: driver update unlocked"
  on public.checklist_checks for update
  using (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_id
        and c.driver_id = auth.uid()
        and c.locked = false
    )
  );

create policy "checklist_checks: admin update any"
  on public.checklist_checks for update
  using ( public.is_admin() );

create policy "checklist_checks: admin delete"
  on public.checklist_checks for delete
  using ( public.is_admin() );

-- ── 5. checklist_photos ──────────────────────────────────────

create table if not exists public.checklist_photos (
  id           uuid              primary key default uuid_generate_v4(),
  checklist_id uuid              not null references public.checklists (id) on delete cascade,
  url          text              not null,
  type         public.photo_type not null default 'pre_check',
  created_at   timestamptz       not null default now()
);

alter table public.checklist_photos enable row level security;

create policy "checklist_photos: driver select own"
  on public.checklist_photos for select
  using (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_id and c.driver_id = auth.uid()
    )
  );

create policy "checklist_photos: admin select all"
  on public.checklist_photos for select
  using ( public.is_admin() );

create policy "checklist_photos: driver insert unlocked"
  on public.checklist_photos for insert
  with check (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_id
        and c.driver_id = auth.uid()
        and c.locked = false
    )
  );

-- Photos are immutable after insert (no update policy for anyone except admin).
create policy "checklist_photos: admin delete"
  on public.checklist_photos for delete
  using ( public.is_admin() );

-- ── 6. incidents ─────────────────────────────────────────────

create table if not exists public.incidents (
  id          uuid                    primary key default uuid_generate_v4(),
  driver_id   uuid                    not null references public.profiles (id) on delete cascade,
  vehicle_id  uuid                    references public.vehicles  (id) on delete set null,
  title       text                    not null default '',
  gps_lat     numeric(10, 7),
  gps_lng     numeric(10, 7),
  voice_text  text,                   -- transcribed voice note
  description text,
  severity    public.incident_severity not null default 'medium',
  status      public.incident_status   not null default 'open',
  has_damage  boolean                 not null default false,
  locked      boolean                 not null default false,
  created_at  timestamptz             not null default now(),
  updated_at  timestamptz             not null default now()
);

alter table public.incidents enable row level security;

create policy "incidents: driver select own"
  on public.incidents for select
  using ( auth.uid() = driver_id );

create policy "incidents: admin select all"
  on public.incidents for select
  using ( public.is_admin() );

create policy "incidents: driver insert own"
  on public.incidents for insert
  with check ( auth.uid() = driver_id );

-- Driver can update only while NOT locked.
create policy "incidents: driver update own unlocked"
  on public.incidents for update
  using ( auth.uid() = driver_id and locked = false )
  with check ( auth.uid() = driver_id );

-- Admin can update anything (e.g. change status to resolved).
create policy "incidents: admin update any"
  on public.incidents for update
  using ( public.is_admin() );

create policy "incidents: admin delete"
  on public.incidents for delete
  using ( public.is_admin() );

-- Trigger: prevent non-admin from unlocking a locked incident.
create or replace function public.prevent_incident_unlock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.locked = true and NEW.locked = false and not public.is_admin() then
    raise exception 'Locked incidents are immutable and cannot be modified.'
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

create trigger trg_prevent_incident_unlock
  before update on public.incidents
  for each row execute procedure public.prevent_incident_unlock();

-- ── finalize_incident() — atomic lock + photo registration ───
-- Called by the client after uploading photos to Storage.
-- Inserts photo path records and sets locked=true in one transaction,
-- eliminating the race condition where a crash leaves the incident unlocked.

create or replace function public.finalize_incident(
  p_incident_id  uuid,
  p_photo_paths  text[],
  p_device_info  jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify the caller owns this incident
  if not exists (
    select 1 from public.incidents
    where id = p_incident_id and driver_id = auth.uid() and locked = false
  ) then
    raise exception 'Incident not found or already locked.'
      using errcode = 'P0002';
  end if;

  -- Insert photo records (path only — signed URLs generated on read)
  if array_length(p_photo_paths, 1) > 0 then
    insert into public.incident_photos (incident_id, path)
    select p_incident_id, unnest(p_photo_paths);
  end if;

  -- Lock atomically
  update public.incidents
  set locked = true, updated_at = now()
  where id = p_incident_id;

  -- Audit log
  perform public.log_audit(
    'submit_incident',
    'incidents',
    p_incident_id,
    p_device_info
  );
end;
$$;

-- ── 7. audit_logs ────────────────────────────────────────────
-- Append-only. Written via the log_audit() security-definer function.
-- No update or delete policies — even admins cannot alter history.

create table if not exists public.audit_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        references public.profiles (id) on delete set null,
  action      text        not null,          -- e.g. 'submit_checklist', 'create_incident'
  entity      text        not null,          -- table name, e.g. 'checklists'
  entity_id   uuid,                          -- PK of the affected row
  device_info jsonb,                         -- { ua, platform, app_version, … }
  timestamp   timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Only admins may read audit logs.
create policy "audit_logs: admin select"
  on public.audit_logs for select
  using ( public.is_admin() );

-- Nobody inserts directly — use the log_audit() function below.
-- No update policy.
-- No delete policy.

-- ── log_audit() — secure audit writer ────────────────────────

create or replace function public.log_audit(
  p_action      text,
  p_entity      text,
  p_entity_id   uuid        default null,
  p_device_info jsonb       default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity, entity_id, device_info)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_device_info);
end;
$$;

-- ── Lock-enforcement trigger ──────────────────────────────────
-- Prevents ANY non-admin from editing child rows once the parent checklist
-- is locked. This is a second layer of defence on top of RLS.

create or replace function public.enforce_checklist_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked boolean;
begin
  select locked into v_locked
  from public.checklists
  where id = coalesce(NEW.checklist_id, OLD.checklist_id);

  if v_locked = true and not public.is_admin() then
    raise exception 'This checklist is locked and cannot be modified (%).',
      TG_TABLE_NAME
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

create trigger lock_guard_checklist_checks
  before insert or update on public.checklist_checks
  for each row execute procedure public.enforce_checklist_lock();

create trigger lock_guard_checklist_photos
  before insert on public.checklist_photos
  for each row execute procedure public.enforce_checklist_lock();

-- ── Auto-lock on submit ───────────────────────────────────────
-- When a checklist transitions to 'submitted', lock it automatically.

create or replace function public.auto_lock_on_submit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.status = 'submitted' and OLD.status <> 'submitted' then
    NEW.locked       := true;
    NEW.submitted_at := coalesce(NEW.submitted_at, now());
  end if;
  return NEW;
end;
$$;

create trigger trg_auto_lock_on_submit
  before update on public.checklists
  for each row execute procedure public.auto_lock_on_submit();

-- ── Auto-create profile on auth signup ───────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'driver')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at maintenance ───────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute procedure public.set_updated_at();

create trigger trg_checklists_updated_at
  before update on public.checklists
  for each row execute procedure public.set_updated_at();

create trigger trg_checklist_checks_updated_at
  before update on public.checklist_checks
  for each row execute procedure public.set_updated_at();

create trigger trg_incidents_updated_at
  before update on public.incidents
  for each row execute procedure public.set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists idx_vehicles_driver       on public.vehicles        (assigned_driver_id);
create index if not exists idx_checklists_driver     on public.checklists      (driver_id);
create index if not exists idx_checklists_vehicle    on public.checklists      (vehicle_id);
create index if not exists idx_checklists_status     on public.checklists      (status);
create index if not exists idx_checklists_created    on public.checklists      (created_at desc);
create index if not exists idx_checks_checklist      on public.checklist_checks(checklist_id);
create index if not exists idx_photos_checklist      on public.checklist_photos(checklist_id);
create index if not exists idx_incidents_driver      on public.incidents        (driver_id);
create index if not exists idx_incidents_vehicle     on public.incidents        (vehicle_id);
create index if not exists idx_incidents_status      on public.incidents        (status);
create index if not exists idx_incidents_severity    on public.incidents        (severity);
create index if not exists idx_incidents_created     on public.incidents        (created_at desc);
create index if not exists idx_audit_logs_user       on public.audit_logs       (user_id);
create index if not exists idx_audit_logs_entity     on public.audit_logs       (entity, entity_id);
create index if not exists idx_audit_logs_timestamp  on public.audit_logs       (timestamp desc);

-- ── Storage buckets (run separately in Supabase Storage tab) ──
-- insert into storage.buckets (id, name, public) values ('checklist-photos', 'checklist-photos', false);
-- insert into storage.buckets (id, name, public) values ('incident-photos',  'incident-photos',  false);
-- insert into storage.buckets (id, name, public) values ('voice-notes',      'voice-notes',      false);
--
-- Storage policies (example for checklist-photos):
-- create policy "drivers upload own photos"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'checklist-photos'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );
-- create policy "drivers read own photos"
--   on storage.objects for select
--   using (
--     bucket_id = 'checklist-photos'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );
-- create policy "admins read all photos"
--   on storage.objects for select
--   using (
--     bucket_id = 'checklist-photos'
--     and public.is_admin()
--   );

-- ── Bootstrap: promote your first admin ──────────────────────
-- After running this schema, create your admin account in Supabase Auth
-- (Dashboard → Authentication → Users → Add User), then run:
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'your-admin@example.com';
--
-- All subsequent driver accounts are created by the admin through the app
-- at /admin/drivers/new — no direct DB access needed.

-- ── End of schema ────────────────────────────────────────────
