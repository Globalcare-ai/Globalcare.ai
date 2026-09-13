-- GlobalCare escrow: patient → escrow custody → company (with refund path).
-- Blockchain holds the money; these tables mirror it for the app/admin UI.

create table if not exists public.escrow (
  id                uuid primary key default gen_random_uuid(),
  journey_id        uuid references public.journeys(id) on delete cascade,
  privy_user_id     text not null,
  patient_wallet    text,
  escrow_wallet     text,
  company_wallet    text,
  chain             text not null default 'sepolia',
  token             text not null default 'USDC',
  deposited_amount  numeric not null default 0,
  released_amount   numeric not null default 0,
  refunded_amount   numeric not null default 0,
  status            text not null default 'funded',
    -- funded | releasing | released | refund_pending | refunded | partially_refunded
  deposit_tx_hash   text,
  created_at        timestamptz not null default now()
);
create index if not exists escrow_journey_idx on public.escrow (journey_id);

create table if not exists public.escrow_milestones (
  id            uuid primary key default gen_random_uuid(),
  journey_id    uuid references public.journeys(id) on delete cascade,
  escrow_id     uuid references public.escrow(id) on delete cascade,
  idx           int not null,
  name          text not null,
  description   text,
  percentage    numeric not null,
  amount        numeric not null default 0,
  status        text not null default 'pending',   -- pending | completed | released
  release_tx_hash text,
  completed_at  timestamptz,
  released_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists escrow_ms_journey_idx on public.escrow_milestones (journey_id);

create table if not exists public.refunds (
  id            uuid primary key default gen_random_uuid(),
  journey_id    uuid references public.journeys(id) on delete cascade,
  escrow_id     uuid references public.escrow(id) on delete cascade,
  requested_by  text,
  reason        text,
  amount        numeric not null default 0,        -- to patient
  to_company    numeric not null default 0,        -- kept by GlobalCare (partial)
  status        text not null default 'requested', -- requested | approved | rejected | refunded
  refund_tx_hash text,
  created_at    timestamptz not null default now()
);
create index if not exists refunds_journey_idx on public.refunds (journey_id);

alter table public.journeys add column if not exists escrow_status text;

alter table public.escrow            enable row level security;
alter table public.escrow_milestones enable row level security;
alter table public.refunds           enable row level security;
do $$
declare t text;
begin
  foreach t in array array['escrow','escrow_milestones','refunds'] loop
    execute format('drop policy if exists %I_all on public.%I;', t, t);
    execute format('create policy %I_all on public.%I for all using (true) with check (true);', t, t);
  end loop;
end $$;
