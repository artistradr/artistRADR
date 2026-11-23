create or replace function public.radr_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'radrStaff'
  );
$$;

revoke all on function public.radr_is_staff() from public, anon;
grant execute on function public.radr_is_staff() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.connected_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  provider            text not null check (provider in ('spotify', 'apple_music', 'buffer')),
  provider_account_id text,
  display_name        text,
  scopes              text,
  status              text not null default 'active'
                        check (status in ('active', 'expired', 'revoked', 'error')),
  last_error          text,
  connected_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.connected_account_secrets (
  account_id    uuid primary key references public.connected_accounts(id) on delete cascade,
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  updated_at    timestamptz not null default now()
);

alter table public.connected_account_secrets enable row level security;
revoke all on public.connected_account_secrets from anon, authenticated;

create table if not exists public.radr_playlists (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null check (platform in ('spotify', 'apple_music')),
  external_id    text not null,
  url            text,
  title          text not null,
  description    text,
  artwork_url    text,
  is_archived    boolean not null default false,
  last_synced_at timestamptz,
  sync_status    text not null default 'never'
                   check (sync_status in ('never', 'ok', 'error', 'syncing')),
  sync_error     text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (platform, external_id)
);

create table if not exists public.tracks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  artists      text[] not null default '{}',
  isrc         text,
  album        text,
  duration_ms  integer,
  release_date date,
  artwork_url  text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create unique index if not exists tracks_isrc_unique
  on public.tracks (isrc) where isrc is not null;

create table if not exists public.track_platform_matches (
  id           uuid primary key default gen_random_uuid(),
  track_id     uuid not null references public.tracks(id) on delete cascade,
  platform     text not null check (platform in ('spotify', 'apple_music')),
  external_id  text not null,
  url          text,
  match_status text not null default 'needs_review'
                 check (match_status in ('confirmed', 'needs_review', 'unavailable', 'rejected')),
  confidence   numeric(4, 3),
  created_at   timestamptz not null default now(),
  unique (platform, external_id)
);

create index if not exists track_platform_matches_track_idx
  on public.track_platform_matches (track_id);

create table if not exists public.playlist_drafts (
  id          uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.radr_playlists(id) on delete cascade,
  status      text not null default 'draft'
                check (status in ('draft', 'ready', 'approved', 'applied', 'cancelled')),
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists one_open_draft_per_playlist
  on public.playlist_drafts (playlist_id)
  where status in ('draft', 'ready', 'approved');

create table if not exists public.playlist_draft_items (
  id        uuid primary key default gen_random_uuid(),
  draft_id  uuid not null references public.playlist_drafts(id) on delete cascade,
  track_id  uuid not null references public.tracks(id) on delete restrict,
  position  integer not null,
  source    text not null default 'manual'
              check (source in ('existing', 'discovery', 'manual')),
  added_at  timestamptz not null default now(),
  unique (draft_id, track_id)
);

create index if not exists playlist_draft_items_order_idx
  on public.playlist_draft_items (draft_id, position);

create table if not exists public.playlist_sync_jobs (
  id              uuid primary key default gen_random_uuid(),
  playlist_id     uuid not null references public.radr_playlists(id) on delete cascade,
  draft_id        uuid references public.playlist_drafts(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  trigger         text not null default 'manual' check (trigger in ('manual', 'scheduled')),
  requested_by    uuid references auth.users(id) on delete set null,
  diff            jsonb,
  result          jsonb,
  error           text,
  idempotency_key text unique,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz
);

create index if not exists playlist_sync_jobs_playlist_idx
  on public.playlist_sync_jobs (playlist_id, created_at desc);

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_created_idx
  on public.activity_logs (created_at desc);

drop trigger if exists set_updated_at on public.connected_accounts;
create trigger set_updated_at before update on public.connected_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.radr_playlists;
create trigger set_updated_at before update on public.radr_playlists
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.playlist_drafts;
create trigger set_updated_at before update on public.playlist_drafts
  for each row execute function public.set_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array[
    'radr_playlists',
    'tracks',
    'track_platform_matches',
    'playlist_drafts',
    'playlist_draft_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "staff full access" on public.%I', t);
    execute format(
      'create policy "staff full access" on public.%I for all to authenticated
         using (public.radr_is_staff()) with check (public.radr_is_staff())', t);
  end loop;
end $$;

alter table public.connected_accounts enable row level security;
drop policy if exists "staff can read" on public.connected_accounts;
create policy "staff can read" on public.connected_accounts
  for select to authenticated using (public.radr_is_staff());

alter table public.playlist_sync_jobs enable row level security;
drop policy if exists "staff can read" on public.playlist_sync_jobs;
create policy "staff can read" on public.playlist_sync_jobs
  for select to authenticated using (public.radr_is_staff());

alter table public.activity_logs enable row level security;
drop policy if exists "staff can read" on public.activity_logs;
create policy "staff can read" on public.activity_logs
  for select to authenticated using (public.radr_is_staff());
drop policy if exists "staff can append" on public.activity_logs;
create policy "staff can append" on public.activity_logs
  for insert to authenticated
  with check (public.radr_is_staff() and actor_id = auth.uid());

insert into public.radr_playlists (platform, external_id, url, title, description)
values
  ('spotify', '3Vq2POEX6IcMsPwvdG6iMv',
   'https://open.spotify.com/playlist/3Vq2POEX6IcMsPwvdG6iMv',
   'New Music Friday', 'Weekly drops playlist'),
  ('spotify', '57Gyugs4KtBVdsJZ18QY6o',
   'https://open.spotify.com/playlist/57Gyugs4KtBVdsJZ18QY6o',
   'RADR Discoveries', 'Emerging artists playlist'),
  ('spotify', '47z1mPJWmcVg9JgHHat8xf',
   'https://open.spotify.com/playlist/47z1mPJWmcVg9JgHHat8xf',
   'RADR Spotlight', 'Featured artists playlist')
on conflict (platform, external_id) do nothing;
