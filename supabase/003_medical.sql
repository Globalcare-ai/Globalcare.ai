-- GlobalCare.ai — medical profile, consultations, and private document storage.
-- Run in the Supabase SQL editor (safe to run more than once).

-- ---------------------------------------------------------------- patients: medical profile
alter table public.patients add column if not exists phone            text;
alter table public.patients add column if not exists date_of_birth    date;
alter table public.patients add column if not exists blood_group      text;
alter table public.patients add column if not exists allergies        text;
alter table public.patients add column if not exists conditions       text;   -- existing conditions
alter table public.patients add column if not exists medications      text;
alter table public.patients add column if not exists medical_history  text;

-- ---------------------------------------------------------------- consultations
create table if not exists public.consultations (
  id                   uuid primary key default gen_random_uuid(),
  journey_id           uuid references public.journeys(id) on delete cascade,
  privy_user_id        text not null,
  doctor_name          text,
  reason               text,                    -- what the consult is about
  scheduled_at         timestamptz,             -- appointment time (from Calendly)
  meeting_url          text,                    -- video link if provided
  status               text not null default 'scheduled',
    -- scheduled | completed | cancelled
  -- doctor's record (filled after the call):
  diagnosis            text,
  recommendations      text,
  prescription         text,
  recommended_hospital text,
  estimated_cost_usd   numeric,
  completed_at         timestamptz,
  created_at           timestamptz not null default now()
);
create index if not exists consultations_privy_user_id_idx on public.consultations (privy_user_id);
create index if not exists consultations_journey_id_idx    on public.consultations (journey_id);

-- ---------------------------------------------------------------- medical_reports: richer columns
alter table public.medical_reports add column if not exists file_name    text;
alter table public.medical_reports add column if not exists content_type text;
alter table public.medical_reports add column if not exists title        text;

-- ---------------------------------------------------------------- RLS (demo-permissive, same as the rest)
alter table public.consultations enable row level security;
drop policy if exists consultations_all on public.consultations;
create policy consultations_all on public.consultations for all using (true) with check (true);

-- ---------------------------------------------------------------- private document storage
-- Bucket is NOT public: files are reached only via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('medical-reports', 'medical-reports', false)
on conflict (id) do nothing;

-- Demo-permissive storage policies (TODO prod: scope by verified Privy user via a
-- server route using the service-role key instead of these open policies).
drop policy if exists medreports_read   on storage.objects;
drop policy if exists medreports_insert on storage.objects;
drop policy if exists medreports_delete on storage.objects;
create policy medreports_read   on storage.objects for select using (bucket_id = 'medical-reports');
create policy medreports_insert on storage.objects for insert with check (bucket_id = 'medical-reports');
create policy medreports_delete on storage.objects for delete using (bucket_id = 'medical-reports');
