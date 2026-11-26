-- The Spotify track an artist picked for a campaign (artwork and details).
-- Applied to the remote project on 2026-11-26.
-- The value comes from the browser, so treat it as artist-supplied: the app
-- builds Spotify links from the id and only shows images from Spotify's host.

alter table public.campaigns add column if not exists spotify_track jsonb;

alter table public.campaigns add constraint campaigns_spotify_track_shape check (
  spotify_track is null or (
    jsonb_typeof(spotify_track) = 'object'
    and coalesce(spotify_track ->> 'spotify_id', '') ~ '^[A-Za-z0-9]{22}$'
    and pg_column_size(spotify_track) < 4000
  )
);

-- Once sent, only staff can change which track a campaign promotes.
create or replace function public.campaigns_lock_spotify_track()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if auth.uid() is not null and not public.radr_is_staff()
     and new.spotify_track is distinct from old.spotify_track then
    raise exception 'Only RADR staff can change that';
  end if;
  return new;
end;
$$;

create trigger campaigns_lock_spotify_track
  before update on public.campaigns
  for each row execute function public.campaigns_lock_spotify_track();
