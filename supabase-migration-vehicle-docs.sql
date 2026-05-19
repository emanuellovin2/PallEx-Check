-- ============================================================
-- PallEx Check — Vehicle Documents Migration
-- Run in: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

-- ── Document type enum ────────────────────────────────────────
do $$ begin
  create type public.vehicle_doc_type as enum (
    'rca',
    'carte_verde',
    'itp',
    'tahograf',
    'revizie_ulei',
    'revizie_generala',
    'rovinieta',
    'licenta_transport',
    'cmr'
  );
exception when duplicate_object then null; end $$;

-- ── vehicle_documents table ───────────────────────────────────
create table if not exists public.vehicle_documents (
  id          uuid                      primary key default uuid_generate_v4(),
  vehicle_id  uuid                      not null references public.vehicles (id) on delete cascade,
  doc_type    public.vehicle_doc_type   not null,
  label       text                      not null,
  expires_at  date                      not null,
  issued_at   date,
  notes       text,
  created_at  timestamptz               not null default now(),
  updated_at  timestamptz               not null default now()
);

alter table public.vehicle_documents enable row level security;

-- Only admins can read/write vehicle documents
create policy "vehicle_documents: admin select all"
  on public.vehicle_documents for select
  using ( public.is_admin() );

create policy "vehicle_documents: admin insert"
  on public.vehicle_documents for insert
  with check ( public.is_admin() );

create policy "vehicle_documents: admin update"
  on public.vehicle_documents for update
  using ( public.is_admin() );

create policy "vehicle_documents: admin delete"
  on public.vehicle_documents for delete
  using ( public.is_admin() );

-- ── updated_at trigger ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicle_documents_updated_at on public.vehicle_documents;
create trigger vehicle_documents_updated_at
  before update on public.vehicle_documents
  for each row execute function public.set_updated_at();

-- ── audit log entries for document changes ────────────────────
-- Reuse existing audit_logs table structure
create or replace function public.audit_vehicle_doc_change()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'vehicle_doc_added',
      'vehicle_document',
      new.id,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'doc_type', new.doc_type,
        'label', new.label,
        'expires_at', new.expires_at
      )
    );
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'vehicle_doc_updated',
      'vehicle_document',
      new.id,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'doc_type', new.doc_type,
        'label', new.label,
        'expires_at', new.expires_at,
        'old_expires_at', old.expires_at
      )
    );
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'vehicle_doc_deleted',
      'vehicle_document',
      old.id,
      jsonb_build_object(
        'vehicle_id', old.vehicle_id,
        'doc_type', old.doc_type,
        'label', old.label
      )
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_vehicle_doc on public.vehicle_documents;
create trigger audit_vehicle_doc
  after insert or update or delete on public.vehicle_documents
  for each row execute function public.audit_vehicle_doc_change();
