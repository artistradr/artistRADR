-- Saved from the remote database on 2026-11-26 (applied as version 20261125194914).
-- Undoes the playlist_submissions linking from 20261125194255 and gives campaigns their own review fields.

-- A. Undo the earlier linking: campaigns no longer live in playlist_submissions
drop trigger if exists studio_campaign_to_submission on public.campaigns;
drop trigger if exists studio_campaign_removed on public.campaigns;
drop trigger if exists studio_sync_campaign_status on public.playlist_submissions;
drop trigger if exists zz_studio_campaign_start on public.playlist_submissions;
drop function if exists public.studio_campaign_to_submission();
drop function if exists public.studio_campaign_removed_to_submission();
drop function if exists public.studio_sync_campaign_from_submission();
drop function if exists public.studio_campaign_start_on_approve();
drop view if exists public.studio_submissions_overview;
delete from public.playlist_submissions where campaign_id is not null;
drop index if exists public.playlist_submissions_campaign_id_key;
alter table public.playlist_submissions drop column if exists campaign_id;

-- B. Campaigns carry their own duration, review and contact fields
alter table public.campaigns
  add column if not exists artist_name text,
  add column if not exists contact_email text,
  add column if not exists campaign_days int check (campaign_days is null or campaign_days between 1 and 365),
  add column if not exists campaign_started_at timestamptz,
  add column if not exists campaign_ends_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;
create index if not exists campaigns_status_created_idx on public.campaigns (status, created_at desc);

-- C. On insert: always pending, snapshot artist name and email, clear staff-only fields
create or replace function public.studio_campaign_force_pending()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.status := 'pending';
  new.spent := 0;
  new.campaign_days := null;
  new.campaign_started_at := null;
  new.campaign_ends_at := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.review_note := null;
  select coalesce(nullif(p.artist_name, ''), nullif(p.full_name, '')) into new.artist_name
    from public.profiles p where p.id = new.user_id;
  select u.email into new.contact_email from auth.users u where u.id = new.user_id;
  return new;
end;
$$;
revoke execute on function public.studio_campaign_force_pending() from public, anon, authenticated;

-- D. Artists can pause/resume/remove only; staff-only fields are locked for them
create or replace function public.studio_campaign_guard_update()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    if (new.user_id, new.spent, new.artist_name, new.contact_email, new.campaign_days,
        new.campaign_started_at, new.campaign_ends_at, new.reviewed_at, new.reviewed_by, new.review_note)
       is distinct from
       (old.user_id, old.spent, old.artist_name, old.contact_email, old.campaign_days,
        old.campaign_started_at, old.campaign_ends_at, old.reviewed_at, old.reviewed_by, old.review_note) then
      raise exception 'Only RADR staff can change that';
    end if;
    if new.status is distinct from old.status then
      if old.status = 'pending' and new.status <> 'removed' then
        raise exception 'This campaign is waiting for RADR approval';
      end if;
      if old.status in ('removed', 'completed') then
        raise exception 'This campaign is closed';
      end if;
      if not ((old.status in ('active', 'paused') and new.status in ('active', 'paused'))
              or new.status = 'removed') then
        raise exception 'Status change not allowed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- E. Approving starts the duration clock; staff decisions are stamped
create or replace function public.studio_campaign_review_dates()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'pending' and new.status = 'active' then
      new.campaign_days := coalesce(new.campaign_days, 14);
      new.campaign_started_at := now();
      new.campaign_ends_at := now() + make_interval(days => new.campaign_days);
      new.started_on := current_date;
    end if;
    if old.status = 'pending' and new.status in ('active', 'removed') and public.radr_is_staff() then
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
  elsif new.campaign_days is distinct from old.campaign_days
        and new.campaign_started_at is not null and new.campaign_days is not null then
    new.campaign_ends_at := new.campaign_started_at + make_interval(days => new.campaign_days);
  end if;
  return new;
end;
$$;
drop trigger if exists studio_campaign_review_dates on public.campaigns;
create trigger studio_campaign_review_dates
  before update on public.campaigns
  for each row execute function public.studio_campaign_review_dates();

-- F. The hourly job now also completes campaigns whose time is up
create or replace function public.studio_resolve_expired_campaigns()
returns integer language plpgsql set search_path to 'public' as $$
declare n int; m int;
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  update public.playlist_submissions
  set status = 'resolved'
  where status = 'approved' and campaign_ends_at is not null and campaign_ends_at <= now();
  get diagnostics n = row_count;
  update public.campaigns
  set status = 'completed'
  where status in ('active', 'paused') and campaign_ends_at is not null and campaign_ends_at <= now();
  get diagnostics m = row_count;
  return n + m;
end;
$$;

-- G. Backfill name and email for existing campaigns
update public.campaigns c set
  artist_name = (select coalesce(nullif(p.artist_name, ''), nullif(p.full_name, '')) from public.profiles p where p.id = c.user_id),
  contact_email = (select u.email from auth.users u where u.id = c.user_id)
where c.artist_name is null and c.contact_email is null;
