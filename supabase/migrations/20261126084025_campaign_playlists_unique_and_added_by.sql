-- Saved from the remote database on 2026-11-26 (applied as version 20261126084025).

-- One row per playlist per campaign, plus an index for the artist-side lookup.
create unique index if not exists campaign_playlists_campaign_playlist_key
  on public.campaign_playlists (campaign_id, spotify_playlist_id);

create index if not exists campaign_playlists_campaign_id_idx
  on public.campaign_playlists (campaign_id);

-- Record which staff member attached a playlist without the browser sending it.
alter table public.campaign_playlists
  alter column added_by set default auth.uid();
