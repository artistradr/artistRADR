-- Studio: Buffer drafts. Images must be at a public URL for Buffer to fetch them,
-- so approved artwork that is sent to Buffer is copied into a public bucket.

insert into storage.buckets (id, name, public)
values ('studio-public', 'studio-public', true)
on conflict (id) do nothing;

drop policy if exists "staff write studio public" on storage.objects;
create policy "staff write studio public" on storage.objects
  for all to authenticated
  using (bucket_id = 'studio-public' and public.radr_is_staff())
  with check (bucket_id = 'studio-public' and public.radr_is_staff());

create table if not exists public.buffer_posts (
  id              uuid primary key default gen_random_uuid(),
  artwork_id      uuid not null references public.top10_artworks(id) on delete cascade,
  channel_id      text not null,
  channel_name    text,
  service         text,
  caption         text not null,
  image_url       text not null,
  status          text not null default 'sending'
                    check (status in ('sending', 'draft', 'failed')),
  buffer_post_id  text,
  error           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- One live draft per artwork and channel: stops accidental double sends.
create unique index if not exists buffer_posts_one_live
  on public.buffer_posts (artwork_id, channel_id)
  where status in ('sending', 'draft');

alter table public.buffer_posts enable row level security;
drop policy if exists "staff can read" on public.buffer_posts;
create policy "staff can read" on public.buffer_posts
  for select to authenticated using (public.radr_is_staff());
-- Writes happen only in the studio-buffer Edge Function (service key).
