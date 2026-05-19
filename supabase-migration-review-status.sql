-- ============================================================
-- PallEx Check — Add review_status to checklists
-- Rulează în: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

alter table public.checklists
  add column if not exists review_status text
    check (review_status in ('pending', 'verified', 'needs_review'))
    default 'pending';

do $$ begin
  raise notice 'review_status column adăugat cu succes!';
end $$;
