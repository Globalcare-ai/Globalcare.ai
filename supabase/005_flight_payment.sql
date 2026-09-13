-- Persist the selected flight on the journey (for the GlobalCare Pass ticket).
alter table public.journeys add column if not exists flight_airline text;
alter table public.journeys add column if not exists flight_from    text;   -- IATA origin
alter table public.journeys add column if not exists flight_to      text;   -- IATA destination
alter table public.journeys add column if not exists flight_depart  timestamptz;
alter table public.journeys add column if not exists flight_return  timestamptz;
alter table public.journeys add column if not exists flight_price   numeric;
alter table public.journeys add column if not exists origin_city    text;
