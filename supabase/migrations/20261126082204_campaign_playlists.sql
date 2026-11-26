-- Saved from the remote database on 2026-11-26 (applied as version 20261126082204).

-- Playlists that carry a campaign's track. Staff add and remove them;
-- artists can only read the ones on their own campaigns.
create table public.campaign_playlists (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  spotify_playlist_id text not null check (spotify_playlist_id ~ '^[A-Za-z0-9]{22}$'),
  title text check (char_length(title) <= 200),
  image_url text check (image_url is null or (image_url like 'https://%' and char_length(image_url) <= 500)),
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, spotify_playlist_id)
);

alter table public.campaign_playlists enable row level security;

create policy "Staff manage campaign playlists" on public.campaign_playlists
  for all to authenticated
  using (public.radr_is_staff()) with check (public.radr_is_staff());

create policy "Artists read their campaign playlists" on public.campaign_playlists
  for select to authenticated
  using (exists (select 1 from public.campaigns c
                 where c.id = campaign_id and c.user_id = (select auth.uid())));

revoke all on public.campaign_playlists from anon;
