-- Profile images. Run in the Supabase SQL editor (safe to re-run).
alter table public.patients add column if not exists avatar_url text;

-- Public bucket for avatars (profile photos aren't sensitive like medical docs).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read   on storage.objects;
drop policy if exists avatars_write  on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;
create policy avatars_read   on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write  on storage.objects for insert with check (bucket_id = 'avatars');
create policy avatars_update on storage.objects for update using (bucket_id = 'avatars');
create policy avatars_delete on storage.objects for delete using (bucket_id = 'avatars');
