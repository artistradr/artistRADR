-- One open draft per playlist (draft or ready).
create unique index if not exists playlist_drafts_one_open_per_playlist
  on public.playlist_drafts (playlist_id)
  where status in ('draft', 'ready');

-- Adds a Spotify track to a playlist's open draft in one atomic step.
-- SECURITY INVOKER: staff-only RLS still applies; the explicit check gives a clear error.
create or replace function public.studio_add_track_to_draft(
  p_playlist_id uuid,
  p_track jsonb,
  p_source text default 'manual'
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_draft uuid;
  v_track uuid;
  v_ext text;
  v_pos int;
  v_rows int;
begin
  if not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  v_ext := nullif(p_track->>'spotify_id', '');
  if v_ext is null then
    raise exception 'spotify_id is required';
  end if;
  if p_source not in ('existing', 'discovery', 'manual') then
    raise exception 'invalid source';
  end if;

  -- Serialise concurrent adds to the same playlist.
  perform 1 from public.radr_playlists where id = p_playlist_id for update;
  if not found then
    raise exception 'playlist not found';
  end if;

  select id into v_draft
  from public.playlist_drafts
  where playlist_id = p_playlist_id and status in ('draft', 'ready')
  order by created_at
  limit 1;

  if v_draft is null then
    insert into public.playlist_drafts (playlist_id, created_by)
    values (p_playlist_id, auth.uid())
    returning id into v_draft;
  end if;

  -- Canonical track: reuse if this Spotify ID is already matched.
  select track_id into v_track
  from public.track_platform_matches
  where platform = 'spotify' and external_id = v_ext;

  if v_track is null then
    insert into public.tracks (title, artists, isrc, album, duration_ms, artwork_url, created_by)
    values (
      coalesce(nullif(p_track->>'name', ''), 'Untitled'),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_track->'artists', '[]'::jsonb))), '{}'),
      nullif(p_track->>'isrc', ''),
      nullif(p_track->>'album', ''),
      nullif(p_track->>'duration_ms', '')::int,
      nullif(p_track->>'image', ''),
      auth.uid()
    )
    returning id into v_track;

    insert into public.track_platform_matches (track_id, platform, external_id, url, match_status, confidence)
    values (v_track, 'spotify', v_ext, 'https://open.spotify.com/track/' || v_ext, 'confirmed', 1);
  end if;

  select coalesce(max(position), -1) + 1 into v_pos
  from public.playlist_draft_items where draft_id = v_draft;

  insert into public.playlist_draft_items (draft_id, track_id, position, source)
  values (v_draft, v_track, v_pos, p_source)
  on conflict (draft_id, track_id) do nothing;
  get diagnostics v_rows = row_count;

  update public.playlist_drafts set updated_at = now() where id = v_draft;

  return jsonb_build_object(
    'draft_id', v_draft,
    'track_id', v_track,
    'added', v_rows > 0
  );
end;
$$;

revoke all on function public.studio_add_track_to_draft(uuid, jsonb, text) from public, anon;
grant execute on function public.studio_add_track_to_draft(uuid, jsonb, text) to authenticated;
