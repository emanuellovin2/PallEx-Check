-- ============================================================
-- PallEx Check — Fix definitiv submit checklist + storage policies
-- Rulează în: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

-- ── 1. Funcție RPC submit_checklist (SECURITY DEFINER) ───────
-- Înlocuiește direct UPDATE din client — rulează ca postgres,
-- bypassează RLS și orice problemă de trigger.

create or replace function public.submit_checklist(p_checklist_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checklist public.checklists%rowtype;
begin
  -- Verifică că checklist-ul aparține utilizatorului curent și nu e blocat
  select * into v_checklist
  from public.checklists
  where id = p_checklist_id
    and driver_id = auth.uid()
    and locked = false;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Checklist not found or already locked');
  end if;

  -- Actualizează status → declanșează auto_lock_on_submit trigger
  update public.checklists
  set status = 'submitted'
  where id = p_checklist_id;

  -- Audit log (non-fatal)
  begin
    perform public.log_audit(
      'submit_checklist',
      'checklists',
      p_checklist_id,
      null
    );
  exception when others then null;
  end;

  return jsonb_build_object('ok', true);

exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

alter function public.submit_checklist(uuid) owner to postgres;

-- ── 2. Storage policies pentru checklist-photos ──────────────
-- Fără aceste policies, pozele nu se pot încărca deloc.

-- Șoferii pot încărca poze în propriul folder (driver_id/...)
create policy "checklist-photos: driver upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'checklist-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Șoferii pot citi propriile poze
create policy "checklist-photos: driver read own"
  on storage.objects for select
  using (
    bucket_id = 'checklist-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Adminii pot citi toate pozele
create policy "checklist-photos: admin read all"
  on storage.objects for select
  using (
    bucket_id = 'checklist-photos'
    and public.is_admin()
  );

-- Adminii pot șterge
create policy "checklist-photos: admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'checklist-photos'
    and public.is_admin()
  );

-- ── 3. Storage policies pentru incident-photos ───────────────
create policy "incident-photos: driver upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'incident-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "incident-photos: driver read own"
  on storage.objects for select
  using (
    bucket_id = 'incident-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "incident-photos: admin read all"
  on storage.objects for select
  using (
    bucket_id = 'incident-photos'
    and public.is_admin()
  );

create policy "incident-photos: admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'incident-photos'
    and public.is_admin()
  );

do $$
begin
  raise notice 'submit_checklist RPC + storage policies aplicate cu succes!';
end $$;
