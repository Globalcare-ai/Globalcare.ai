-- GlobalCare.ai — Phase 1 schema
-- Auth is handled by Privy; every row is keyed by the Privy user id (text).
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).

-- ------------------------------------------------------------------
-- patients
-- ------------------------------------------------------------------
create table if not exists public.patients (
  id             uuid primary key default gen_random_uuid(),
  privy_user_id  text unique not null,
  name           text,
  email          text,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- journeys  (one active medical trip)
-- ------------------------------------------------------------------
create table if not exists public.journeys (
  id                   uuid primary key default gen_random_uuid(),
  privy_user_id        text not null,
  patient_id           uuid references public.patients(id) on delete cascade,
  condition            text,                 -- e.g. "Hair transplant"
  treatment            text,                 -- e.g. "FUE, ~3500 grafts"
  destination_country  text,                 -- e.g. "Turkey"
  destination_city     text,                 -- e.g. "Istanbul"
  hospital_name        text,
  status               text not null default 'intake',
    -- intake | recommendation | travel | payment | confirmed
  total_cost_usd       numeric,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists journeys_privy_user_id_idx on public.journeys (privy_user_id);

-- ------------------------------------------------------------------
-- medical_reports  (uploaded scans / PDFs + AI analysis)
-- ------------------------------------------------------------------
create table if not exists public.medical_reports (
  id            uuid primary key default gen_random_uuid(),
  journey_id    uuid references public.journeys(id) on delete cascade,
  privy_user_id text not null,
  file_url      text,          -- private Supabase Storage path
  ai_analysis   text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- payments  (USDC escrow)
-- ------------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  journey_id     uuid references public.journeys(id) on delete cascade,
  privy_user_id  text not null,
  amount_usd     numeric,
  amount_usdc    numeric,
  tx_hash        text,
  escrow_status  text not null default 'pending',
    -- pending | funded | partially_released | completed | refunded
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- RLS — DEMO/MVP policies (permissive).
-- NOTE: because we authenticate with Privy (not Supabase Auth), auth.uid()
-- is null here, so these policies are open. Fine for the hackathon demo.
-- TODO (production): route DB access through Next API routes that verify the
-- Privy access token server-side, then scope rows to the verified privy_user_id.
-- ------------------------------------------------------------------
alter table public.patients        enable row level security;
alter table public.journeys        enable row level security;
alter table public.medical_reports enable row level security;
alter table public.payments        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['patients','journeys','medical_reports','payments'] loop
    execute format('drop policy if exists %I_all on public.%I;', t, t);
    execute format(
      'create policy %I_all on public.%I for all using (true) with check (true);', t, t
    );
  end loop;
end $$;
