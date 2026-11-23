create table if not exists public.discovery_sources (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null default 'other'
               check (kind in ('manual', 'playlist', 'blog', 'chart', 'social', 'other')),
  url        text,
  notes      text,
  is_active  boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_candidates (
  id                   uuid primary key default gen_random_uuid(),
  source_id            uuid references public.discovery_sources(id) on delete set null,
  artist_name          text not null,
  track_title          text not null,
  link_url             text,
  note                 text,
  spotify_track        jsonb,
  signals              jsonb not null default '[]'::jsonb,
  status               text not null default 'new'
                         check (status in ('new', 'saved', 'accepted', 'rejected')),
  track_id             uuid references public.tracks(id) on delete set null,
  accepted_playlist_id uuid references public.radr_playlists(id) on delete set null,
  created_by           uuid references auth.users(id) on delete set null,
  decided_by           uuid references auth.users(id) on delete set null,
  decided_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists discovery_candidates_status_idx
  on public.discovery_candidates (status, created_at desc);

drop trigger if exists set_updated_at on public.discovery_sources;
create trigger set_updated_at before update on public.discovery_sources
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.discovery_candidates;
create trigger set_updated_at before update on public.discovery_candidates
  for each row execute function public.set_updated_at();

alter table public.discovery_sources enable row level security;
drop policy if exists "staff full access" on public.discovery_sources;
create policy "staff full access" on public.discovery_sources
  for all to authenticated
  using (public.radr_is_staff()) with check (public.radr_is_staff());

alter table public.discovery_candidates enable row level security;
drop policy if exists "staff full access" on public.discovery_candidates;
create policy "staff full access" on public.discovery_candidates
  for all to authenticated
  using (public.radr_is_staff()) with check (public.radr_is_staff());

-- Accept a candidate into a playlist's draft (source = 'discovery').
-- Never touches Spotify: the track only lands in the draft, which still needs
-- review, approval and sync.
create or replace function public.studio_accept_candidate(
  p_candidate_id uuid,
  p_playlist_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_c public.discovery_candidates;
  v_res jsonb;
begin
  if not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  select * into v_c from public.discovery_candidates where id = p_candidate_id for update;
  if not found then
    raise exception 'candidate not found';
  end if;
  if v_c.status = 'rejected' then
    raise exception 'this candidate was rejected';
  end if;
  if v_c.status = 'accepted' then
    raise exception 'this candidate was already accepted';
  end if;
  if v_c.spotify_track is null or nullif(v_c.spotify_track->>'spotify_id', '') is null then
    raise exception 'find a Spotify match for this candidate first';
  end if;

  v_res := public.studio_add_track_to_draft(p_playlist_id, v_c.spotify_track, 'discovery');

  update public.discovery_candidates
  set status = 'accepted',
      track_id = (v_res->>'track_id')::uuid,
      accepted_playlist_id = p_playlist_id,
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_candidate_id;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(), 'discovery.accepted', 'playlist', p_playlist_id::text,
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'artist', v_c.artist_name,
      'title', v_c.track_title,
      'already_in_draft', not coalesce((v_res->>'added')::boolean, false)
    )
  );

  return v_res;
end;
$$;

revoke all on function public.studio_accept_candidate(uuid, uuid) from public, anon;
grant execute on function public.studio_accept_candidate(uuid, uuid) to authenticated;
