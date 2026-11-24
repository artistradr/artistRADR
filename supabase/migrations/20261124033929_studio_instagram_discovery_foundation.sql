-- Instagram discovery: watchlist + our own point-in-time snapshots (staff only).
-- Already applied to the remote database on 2026-11-24 (name: studio_instagram_discovery_foundation).
-- Save in supabase/migrations/ with this exact file name (version matches the remote).

alter table public.connected_accounts drop constraint connected_accounts_provider_check;
alter table public.connected_accounts add constraint connected_accounts_provider_check
  check (provider = any (array['spotify','apple_music','buffer','instagram']));

create table public.discovery_ig_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  ig_user_id text,
  display_name text,
  followers_count integer,
  media_count integer,
  is_active boolean not null default true,
  notes text,
  last_checked_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discovery_ig_accounts_username_format check (username ~ '^[a-z0-9._]{1,30}$')
);
create unique index discovery_ig_accounts_username_key on public.discovery_ig_accounts (username);

create table public.discovery_ig_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.discovery_ig_accounts(id) on delete cascade,
  observed_at timestamptz not null default now(),
  followers_count integer,
  media_count integer,
  posts jsonb not null default '[]'::jsonb
);
create index discovery_ig_snapshots_account_time on public.discovery_ig_snapshots (account_id, observed_at desc);

alter table public.discovery_ig_accounts enable row level security;
alter table public.discovery_ig_snapshots enable row level security;

create policy "staff full access" on public.discovery_ig_accounts
  for all to authenticated using (public.radr_is_staff()) with check (public.radr_is_staff());

-- Snapshots are written only by the Edge Function (service role). Staff can read.
create policy "staff can read" on public.discovery_ig_snapshots
  for select to authenticated using (public.radr_is_staff());

revoke all on public.discovery_ig_accounts from anon;
revoke all on public.discovery_ig_snapshots from anon;
