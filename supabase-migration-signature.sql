-- ============================================================
-- PallEx Check — Digital Signature Migration
-- Run in: Supabase Dashboard › SQL Editor › New Query
-- ============================================================

alter table public.checklist_checks
  add column if not exists signature_data_url text;
