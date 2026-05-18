-- ============================================================
-- PallEx Check — Incidents v2 Migration
-- Run in: Supabase Dashboard › SQL Editor › New Query
--
-- NOTĂ: Coloanele title/locked/has_damage, policy-ul actualizat
-- și trigger-ul sunt deja incluse în supabase-schema.sql (schema de bază).
-- Rulează acest fișier DOAR pe instanțe existente care au pornit
-- din schema veche (înainte de 2026-05-18).
-- ============================================================

-- ── 1. Add missing columns to incidents (idempotent) ─────────

alter table public.incidents
  add column if not exists title       text        not null default '',
  add column if not exists locked      boolean     not null default false,
  add column if not exists has_damage  boolean     not null default false;

-- ── 2. Drop old unrestricted driver update policy ────────────

drop policy if exists "incidents: driver update own" on public.incidents;

-- ── 3. New driver update policy — only while NOT locked ──────

create policy "incidents: driver update own unlocked"
  on public.incidents for update
  using ( auth.uid() = driver_id and locked = false )
  with check ( auth.uid() = driver_id );

-- ── 4. Trigger: prevent non-admin from unlocking ─────────────

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

drop trigger if exists trg_prevent_incident_unlock on public.incidents;
create trigger trg_prevent_incident_unlock
  before update on public.incidents
  for each row execute procedure public.prevent_incident_unlock();

-- ── 5. incident_photos table ─────────────────────────────────

create table if not exists public.incident_photos (
  id          uuid        primary key default uuid_generate_v4(),
  incident_id uuid        not null references public.incidents (id) on delete cascade,
  path        text        not null,   -- storage path: {userId}/{incidentId}/{filename}
  created_at  timestamptz not null default now()
);

alter table public.incident_photos enable row level security;

-- Driver sees only their own incident photos.
create policy "incident_photos: driver select own"
  on public.incident_photos for select
  using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.driver_id = auth.uid()
    )
  );

create policy "incident_photos: admin select all"
  on public.incident_photos for select
  using ( public.is_admin() );

-- Driver may only upload photos while the incident is NOT locked.
create policy "incident_photos: driver insert unlocked"
  on public.incident_photos for insert
  with check (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id
        and i.driver_id = auth.uid()
        and i.locked = false
    )
  );

-- Photos are immutable after insert — no update, no driver delete.
create policy "incident_photos: admin delete"
  on public.incident_photos for delete
  using ( public.is_admin() );

-- ── 6. Indexes ───────────────────────────────────────────────

create index if not exists idx_incident_photos_incident
  on public.incident_photos (incident_id);

create index if not exists idx_incidents_locked
  on public.incidents (locked);

-- ── 7. Storage bucket: incident-photos ───────────────────────
-- Run these ONLY if the bucket doesn't exist yet.
-- You can also create the bucket in the Supabase Storage UI.

/*
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', false)
on conflict (id) do nothing;

-- Driver can upload to their own folder
create policy "incident-photos: driver upload"
  on storage.objects for insert
  with check (
    bucket_id = 'incident-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Driver can read own photos
create policy "incident-photos: driver read own"
  on storage.objects for select
  using (
    bucket_id = 'incident-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin reads all
create policy "incident-photos: admin read all"
  on storage.objects for select
  using (
    bucket_id = 'incident-photos'
    and public.is_admin()
  );

-- Admin delete only
create policy "incident-photos: admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'incident-photos'
    and public.is_admin()
  );
*/

-- ── 8. finalize_incident() RPC — atomic lock + photo registration ──
-- Included here for existing instances. Already in supabase-schema.sql
-- for fresh deployments.

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
  if not exists (
    select 1 from public.incidents
    where id = p_incident_id and driver_id = auth.uid() and locked = false
  ) then
    raise exception 'Incident not found or already locked.'
      using errcode = 'P0002';
  end if;

  if array_length(p_photo_paths, 1) > 0 then
    insert into public.incident_photos (incident_id, path)
    select p_incident_id, unnest(p_photo_paths);
  end if;

  update public.incidents
  set locked = true, updated_at = now()
  where id = p_incident_id;

  perform public.log_audit(
    'submit_incident',
    'incidents',
    p_incident_id,
    p_device_info
  );
end;
$$;

-- ── End of migration ─────────────────────────────────────────
