-- Run this AFTER supabase-schema.sql. Creates the public photo bucket and upload rule.
-- If it errors, the rest of the site still works; only photo upload is affected.

-- Photo bucket (public read, small images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('puja-photos', 'puja-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "puja photos public upload" on storage.objects;
create policy "puja photos public upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'puja-photos' and name like 'community/%');
