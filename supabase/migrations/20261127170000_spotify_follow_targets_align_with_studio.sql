-- Align an existing spotify_follow_targets table (from an earlier draft) with the Studio page and the
-- follow-on-spotify edge function. Safe to run on a fresh database: every step is a no-op if the
-- table already matches 20261127120000_spotify_follow_targets.sql.

alter table public.spotify_follow_targets
  add column if not exists is_primary boolean not null default false,
  add column if not exists position   integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- kind: the earlier draft used 'profile'; Spotify URIs use 'user'.
alter table public.spotify_follow_targets drop constraint if exists spotify_follow_targets_kind_check;
update public.spotify_follow_targets set kind = 'user' where kind = 'profile';
alter table public.spotify_follow_targets
  add constraint spotify_follow_targets_kind_check check (kind in ('user', 'playlist', 'artist'));

-- Spotify user ids can contain . _ - and be shorter than 10 characters.
alter table public.spotify_follow_targets drop constraint if exists spotify_follow_targets_spotify_id_check;
alter table public.spotify_follow_targets
  add constraint spotify_follow_targets_spotify_id_check check (spotify_id ~ '^[A-Za-z0-9._-]{1,100}$');

update public.spotify_follow_targets set label = '' where label is null;
alter table public.spotify_follow_targets
  alter column label set default '',
  alter column label set not null;

-- Carry the old ordering into position, then drop the superseded column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'spotify_follow_targets' and column_name = 'sort_order'
  ) then
    update public.spotify_follow_targets t
       set position = r.rn
      from (
        select id, (row_number() over (order by sort_order, created_at) - 1)::int as rn
        from public.spotify_follow_targets
      ) r
     where t.id = r.id;
    alter table public.spotify_follow_targets drop column sort_order;
  end if;
end $$;

-- The Artist RADR profile is the primary target (only if none is set yet).
update public.spotify_follow_targets
   set is_primary = true
 where kind = 'user'
   and spotify_id = '31etosst62tr3hqwcdiepfw3hjk4'
   and not exists (select 1 from public.spotify_follow_targets where is_primary);

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

drop policy if exists "staff full access" on public.spotify_follow_targets;
drop policy if exists "Staff manage spotify follow targets" on public.spotify_follow_targets;
create policy "Staff manage spotify follow targets"
  on public.spotify_follow_targets
  for all
  to authenticated
  using (radr_is_staff())
  with check (radr_is_staff());

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
