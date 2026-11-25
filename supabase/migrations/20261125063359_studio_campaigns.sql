-- Studio: approved submissions become campaigns with a countdown.
-- Duration is set on approval. The countdown starts the first time the song goes live
-- in a RADR playlist (draft applied). When it ends the submission becomes 'resolved'.

alter table public.playlist_submissions
  add column if not exists campaign_days int,
  add column if not exists campaign_started_at timestamptz,
  add column if not exists campaign_ends_at timestamptz,
  add column if not exists track_id uuid references public.tracks(id) on delete set null;

alter table public.playlist_submissions drop constraint if exists playlist_submissions_campaign_days_check;
alter table public.playlist_submissions
  add constraint playlist_submissions_campaign_days_check check (campaign_days is null or campaign_days between 1 and 365);

alter table public.playlist_submissions drop constraint if exists playlist_submissions_status_check;
alter table public.playlist_submissions
  add constraint playlist_submissions_status_check check (status in ('open', 'approved', 'rejected', 'resolved'));

create index if not exists playlist_submissions_campaign_idx
  on public.playlist_submissions (campaign_ends_at) where status = 'approved';

-- Reviewed time should not change when a campaign is resolved automatically.
create or replace function public.set_submission_reviewed_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.status is distinct from old.status and new.status <> 'resolved' then
    new.reviewed_at = now();
  end if;
  return new;
end;
$$;

-- Campaign defaults and resets. Approving without a duration (for example from the old
-- admin screen) gets 14 days. Reopening or rejecting clears the campaign.
create or replace function public.studio_submission_campaign_defaults()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      new.campaign_days := coalesce(new.campaign_days, 14);
      new.campaign_started_at := null;
      new.campaign_ends_at := null;
    elsif new.status in ('open', 'rejected') then
      new.campaign_days := null;
      new.campaign_started_at := null;
      new.campaign_ends_at := null;
    end if;
  elsif new.campaign_days is distinct from old.campaign_days and new.campaign_started_at is not null and new.campaign_days is not null then
    new.campaign_ends_at := new.campaign_started_at + make_interval(days => new.campaign_days);
  end if;
  return new;
end;
$$;

drop trigger if exists studio_submission_campaign_defaults on public.playlist_submissions;
create trigger studio_submission_campaign_defaults
  before update on public.playlist_submissions
  for each row execute function public.studio_submission_campaign_defaults();

-- Start the countdown when a draft is applied (synced to the live playlist).
create or replace function public.studio_start_campaigns_on_apply()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status = 'applied' and old.status is distinct from 'applied' then
    update public.playlist_submissions s
    set campaign_started_at = now(),
        campaign_ends_at = now() + make_interval(days => s.campaign_days)
    where s.status = 'approved'
      and s.campaign_started_at is null
      and s.campaign_days is not null
      and s.track_id in (select i.track_id from public.playlist_draft_items i where i.draft_id = new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.studio_start_campaigns_on_apply() from public, anon, authenticated;

drop trigger if exists studio_start_campaigns_on_apply on public.playlist_drafts;
create trigger studio_start_campaigns_on_apply
  after update of status on public.playlist_drafts
  for each row execute function public.studio_start_campaigns_on_apply();

-- Add an approved submission's song to a playlist draft. First time: pass the Spotify
-- track the staff member picked. After that the saved track is reused.
create or replace function public.studio_add_submission_to_draft(
  p_submission_id uuid, p_playlist_id uuid, p_track jsonb default null
) returns jsonb language plpgsql set search_path to 'public' as $$
declare
  s public.playlist_submissions;
  v_track jsonb := p_track;
  v_res jsonb;
begin
  if not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  select * into s from public.playlist_submissions where id = p_submission_id for update;
  if not found then raise exception 'submission not found'; end if;
  if s.status <> 'approved' then raise exception 'only approved submissions can be added to a playlist'; end if;

  if v_track is null and s.track_id is not null then
    select jsonb_build_object(
      'spotify_id', m.external_id, 'name', t.title, 'artists', to_jsonb(t.artists),
      'isrc', t.isrc, 'album', t.album, 'duration_ms', t.duration_ms, 'image', t.artwork_url)
    into v_track
    from public.tracks t
    join public.track_platform_matches m on m.track_id = t.id and m.platform = 'spotify'
    where t.id = s.track_id
    limit 1;
  end if;
  if v_track is null then
    raise exception 'find this song on Spotify first';
  end if;

  v_res := public.studio_add_track_to_draft(p_playlist_id, v_track, 'manual');
  update public.playlist_submissions set track_id = (v_res->>'track_id')::uuid where id = p_submission_id;
  return v_res;
end;
$$;
revoke execute on function public.studio_add_submission_to_draft(uuid, uuid, jsonb) from public, anon;
grant execute on function public.studio_add_submission_to_draft(uuid, uuid, jsonb) to authenticated;

-- Resolve campaigns whose time is up. Staff can call it; the hourly job runs it too.
create or replace function public.studio_resolve_expired_campaigns()
returns int language plpgsql set search_path to 'public' as $$
declare n int;
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  update public.playlist_submissions
  set status = 'resolved'
  where status = 'approved' and campaign_ends_at is not null and campaign_ends_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.studio_resolve_expired_campaigns() from public, anon;
grant execute on function public.studio_resolve_expired_campaigns() to authenticated;
