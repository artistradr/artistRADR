-- Saved from the remote database on 2026-11-26 (applied as version 20261125194255).
-- Note: the next migration (20261125194914) undoes the playlist_submissions linking in this one.

-- 1. Staff can see and manage every campaign
drop policy if exists "Staff can view all campaigns" on public.campaigns;
create policy "Staff can view all campaigns" on public.campaigns
  for select using (public.radr_is_staff());
drop policy if exists "Staff can update all campaigns" on public.campaigns;
create policy "Staff can update all campaigns" on public.campaigns
  for update using (public.radr_is_staff()) with check (public.radr_is_staff());

-- 2. Link a submission to the campaign it came from
alter table public.playlist_submissions
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade;
create unique index if not exists playlist_submissions_campaign_id_key
  on public.playlist_submissions (campaign_id) where campaign_id is not null;

-- 3. New campaigns always start as pending (staff approval gate)
create or replace function public.studio_campaign_force_pending()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  new.status := 'pending';
  return new;
end;
$$;
drop trigger if exists studio_campaign_force_pending on public.campaigns;
create trigger studio_campaign_force_pending
  before insert on public.campaigns
  for each row execute function public.studio_campaign_force_pending();

-- 4. Non-staff can only pause/resume or remove; pending/closed campaigns are locked
create or replace function public.studio_campaign_guard_update()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if auth.uid() is not null and not public.radr_is_staff()
     and new.status is distinct from old.status then
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
  return new;
end;
$$;
drop trigger if exists studio_campaign_guard_update on public.campaigns;
create trigger studio_campaign_guard_update
  before update on public.campaigns
  for each row execute function public.studio_campaign_guard_update();

-- 5. Every campaign queues into playlist_submissions
create or replace function public.studio_campaign_to_submission()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_artist text; v_email text;
begin
  select coalesce(nullif(p.artist_name, ''), nullif(p.full_name, '')) into v_artist
    from public.profiles p where p.id = new.user_id;
  select u.email into v_email from auth.users u where u.id = new.user_id;
  insert into public.playlist_submissions (status, submitted_by, campaign_id, payload)
  values ('open', new.user_id, new.id, jsonb_build_object(
    'type', 'campaign',
    'campaignId', new.id,
    'artistName', coalesce(v_artist, 'Unknown artist'),
    'trackName', new.name,
    'platform', new.platform,
    'goal', new.goal,
    'budget', new.budget,
    'genre', '',
    'spotifyLink', '',
    'notes', coalesce(new.goal, ''),
    'contactEmail', v_email))
  on conflict (campaign_id) where campaign_id is not null do nothing;
  return new;
end;
$$;
revoke execute on function public.studio_campaign_to_submission() from public, anon, authenticated;
drop trigger if exists studio_campaign_to_submission on public.campaigns;
create trigger studio_campaign_to_submission
  after insert on public.campaigns
  for each row execute function public.studio_campaign_to_submission();

-- 6. Removing a campaign resolves its submission
create or replace function public.studio_campaign_removed_to_submission()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  update public.playlist_submissions
  set status = 'resolved'
  where campaign_id = new.id and status in ('open', 'approved');
  return new;
end;
$$;
revoke execute on function public.studio_campaign_removed_to_submission() from public, anon, authenticated;
drop trigger if exists studio_campaign_removed on public.campaigns;
create trigger studio_campaign_removed
  after update of status on public.campaigns
  for each row when (new.status = 'removed' and old.status is distinct from 'removed')
  execute function public.studio_campaign_removed_to_submission();

-- 7. Staff decisions on the submission flow back to the campaign status
create or replace function public.studio_sync_campaign_from_submission()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.campaign_id is null or new.status is not distinct from old.status then
    return new;
  end if;
  update public.campaigns c
  set status = case new.status
        when 'open' then 'pending'
        when 'approved' then 'active'
        when 'rejected' then 'removed'
        when 'resolved' then 'completed'
        else c.status end,
      started_on = case when new.status = 'approved' then current_date else c.started_on end
  where c.id = new.campaign_id and c.status not in ('removed', 'completed');
  return new;
end;
$$;
revoke execute on function public.studio_sync_campaign_from_submission() from public, anon, authenticated;
drop trigger if exists studio_sync_campaign_status on public.playlist_submissions;
create trigger studio_sync_campaign_status
  after update of status on public.playlist_submissions
  for each row execute function public.studio_sync_campaign_from_submission();

-- 8. Approving a campaign submission starts its duration clock (runs after the defaults trigger)
create or replace function public.studio_campaign_start_on_approve()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.campaign_id is not null and new.status = 'approved'
     and old.status is distinct from 'approved' then
    new.campaign_days := coalesce(new.campaign_days, 14);
    new.campaign_started_at := now();
    new.campaign_ends_at := now() + make_interval(days => new.campaign_days);
  end if;
  return new;
end;
$$;
drop trigger if exists zz_studio_campaign_start on public.playlist_submissions;
create trigger zz_studio_campaign_start
  before update on public.playlist_submissions
  for each row execute function public.studio_campaign_start_on_approve();

-- 9. Backfill: the existing campaign was created pending, then flipped to paused by the pause button
update public.campaigns c set status = 'pending'
where c.status = 'paused'
  and not exists (select 1 from public.playlist_submissions s where s.campaign_id = c.id);

insert into public.playlist_submissions (status, submitted_by, campaign_id, payload)
select 'open', c.user_id, c.id, jsonb_build_object(
  'type', 'campaign', 'campaignId', c.id,
  'artistName', coalesce(nullif(p.artist_name, ''), nullif(p.full_name, ''), 'Unknown artist'),
  'trackName', c.name, 'platform', c.platform, 'goal', c.goal, 'budget', c.budget,
  'genre', '', 'spotifyLink', '', 'notes', coalesce(c.goal, ''), 'contactEmail', u.email)
from public.campaigns c
left join public.profiles p on p.id = c.user_id
left join auth.users u on u.id = c.user_id
where c.status = 'pending'
  and not exists (select 1 from public.playlist_submissions s where s.campaign_id = c.id);

-- 10. Running / resolved state for the Submissions page (tracks and campaigns)
create or replace view public.studio_submissions_overview
with (security_invoker = true) as
select s.*,
  (s.campaign_id is not null) as is_campaign,
  case
    when s.status = 'approved' and s.campaign_started_at is not null and s.campaign_ends_at > now() then 'running'
    when s.status = 'approved' and s.campaign_started_at is not null then 'resolved'
    when s.status = 'resolved' then 'resolved'
    when s.status = 'approved' then 'approved'
    when s.status = 'open' then 'queued'
    else s.status
  end as campaign_state,
  case when s.campaign_ends_at is not null
       then greatest(0, ceil(extract(epoch from (s.campaign_ends_at - now())) / 86400))::int end as days_left
from public.playlist_submissions s;
grant select on public.studio_submissions_overview to authenticated;
