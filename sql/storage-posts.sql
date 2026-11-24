-- created: 2026-11-23T21:50:00-08:00
-- Post picture + video uploads (free-tier size caps)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts',
  'posts',
  true,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = true;

drop policy if exists "posts_public_read" on storage.objects;
drop policy if exists "posts_insert_own" on storage.objects;
drop policy if exists "posts_update_own" on storage.objects;
drop policy if exists "posts_delete_own" on storage.objects;

create policy "posts_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'posts');

create policy "posts_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "posts_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "posts_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
