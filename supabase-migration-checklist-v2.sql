-- ============================================================
-- PallEx Check — Migration: Checklist v2
-- Run in Supabase Dashboard › SQL Editor if you already have
-- the original schema applied.
-- ============================================================

-- Extend photo_type enum with mandatory photo slots
alter type public.photo_type add value if not exists 'front';
alter type public.photo_type add value if not exists 'back';
alter type public.photo_type add value if not exists 'side';

-- Add cargo & damage columns to checklist_checks
alter table public.checklist_checks
  add column if not exists cargo_type           text,
  add column if not exists cargo_quantity       integer,
  add column if not exists cargo_notes          text,
  add column if not exists has_damage           boolean default false,
  add column if not exists damage_description   text,
  add column if not exists damage_voice_text    text;
