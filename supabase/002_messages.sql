-- Adds full chat-history storage to each journey so patients can resume later.
-- Run in the Supabase SQL editor (safe to run more than once).
alter table public.journeys
  add column if not exists messages jsonb not null default '[]'::jsonb;
