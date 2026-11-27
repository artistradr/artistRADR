-- Spotify follow targets: what a user follows on Spotify when they connect during playlist submission.
--
-- One row is the PRIMARY target (the Artist RADR profile). It is the only follow the site shows and the
-- only one that can fail the step. Every other active row is followed quietly in the background by the
-- follow-on-spotify edge function (best effort, failures are logged and never shown).
--
-- Only staff can read or change this table. The edge function reads it with the service role, so the
-- list of hidden follows is never exposed to the browser.

create table if not exists public.spotify_follow_targets (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('user', 'playlist', 'artist')),
  spotify_id  text not null check (spotify_id ~ '^[A-Za-z0-9._-]{1,100}$'),
  label       text not null default '',
  is_primary  boolean not null default false,
  active      boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kind, spotify_id)
);

-- At most one primary target.
create unique index if not exists spotify_follow_targets_one_primary
  on public.spotify_follow_targets (is_primary) where is_primary;

create or replace function public.spotify_follow_targets_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists spotify_follow_targets_touch on public.spotify_follow_targets;
create trigger spotify_follow_targets_touch
  before update on public.spotify_follow_targets
  for each row execute function public.spotify_follow_targets_touch();

alter table public.spotify_follow_targets enable row level security;

drop policy if exists "Staff manage spotify follow targets" on public.spotify_follow_targets;
create policy "Staff manage spotify follow targets"
  on public.spotify_follow_targets
  for all
  to authenticated
  using (radr_is_staff())
  with check (radr_is_staff());

-- Make one target the primary, atomically (the unique index allows only one).
create or replace function public.spotify_follow_set_primary(target_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.radr_is_staff() then
    raise exception 'not allowed';
  end if;
  update public.spotify_follow_targets set is_primary = false where is_primary and id <> target_id;
  update public.spotify_follow_targets set is_primary = true, active = true where id = target_id;
end;
$$;

revoke execute on function public.spotify_follow_set_primary(uuid) from public, anon;
grant execute on function public.spotify_follow_set_primary(uuid) to authenticated;

-- Seed with what the edge function followed before this change.
insert into public.spotify_follow_targets (kind, spotify_id, label, is_primary, position) values
  ('user',     '31etosst62tr3hqwcdiepfw3hjk4', 'Artist RADR',      true,  0),
  ('playlist', '3Vq2POEX6IcMsPwvdG6iMv',       'New Music Friday', false, 1),
  ('playlist', '57Gyugs4KtBVdsJZ18QY6o',       'RADR Discoveries', false, 2),
  ('playlist', '47z1mPJWmcVg9JgHHat8xf',       'RADR Spotlight',   false, 3)
on conflict (kind, spotify_id) do nothing;
