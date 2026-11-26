-- Daily plan ($2.99-$14.99 per day, 7-30 days) and an optional second song on Supercharge.
alter table public.campaigns
  add column if not exists daily_rate numeric(6,2),
  add column if not exists plan_days integer,
  add column if not exists extra_track jsonb;

alter table public.campaigns drop constraint if exists campaigns_package_check;
alter table public.campaigns add constraint campaigns_package_check
  check (package is null or package = any (array['starter','basic','daily','supercharge','presave']));

alter table public.campaigns drop constraint if exists campaigns_plan_fields_check;
alter table public.campaigns add constraint campaigns_plan_fields_check
  check (
    (daily_rate is null or (daily_rate >= 2.99 and daily_rate <= 14.99))
    and (plan_days is null or (plan_days >= 7 and plan_days <= 30))
    and (extra_track is null or (
      jsonb_typeof(extra_track) = 'object'
      and coalesce(extra_track ->> 'spotify_id', '') ~ '^[A-Za-z0-9]{22}$'
      and pg_column_size(extra_track) < 4000))
  );

create or replace function public.studio_campaign_force_pending()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  new.status := 'pending';
  new.spent := 0;
  new.started_on := current_date;
  new.next_billing := null;
  new.payment_method := null;
  new.created_at := now();
  new.campaign_days := null;
  new.campaign_started_at := null;
  new.campaign_ends_at := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.review_note := null;

  if new.package in ('starter','basic') then
    if new.budget is distinct from (case new.package when 'starter' then 25 else 50 end) then
      raise exception 'That price does not match the package';
    end if;
  elsif new.package = 'daily' then
    if new.daily_rate is null or new.daily_rate < 2.99 or new.daily_rate > 14.99 then
      raise exception 'The daily spend must be between $2.99 and $14.99';
    end if;
    if new.plan_days is null or new.plan_days < 7 or new.plan_days > 30 then
      raise exception 'A daily campaign runs from 7 to 30 days';
    end if;
    if new.budget is distinct from round(new.daily_rate * new.plan_days, 2) then
      raise exception 'That price does not match the daily spend and number of days';
    end if;
  elsif new.package = 'supercharge' then
    if new.budget is null or new.budget < 100 or new.budget > 999 or new.budget <> trunc(new.budget) then
      raise exception 'Supercharge takes a whole dollar amount from $100 to $999';
    end if;
  elsif new.package = 'presave' then
    if new.budget is null or new.budget < 50 then
      raise exception 'The minimum budget for this campaign is $50';
    end if;
    if new.release_date is null or new.release_date < current_date then
      raise exception 'A pre-save campaign needs an upcoming release date';
    end if;
  end if;

  -- Plan fields only apply to the plans that use them.
  if new.package is distinct from 'daily' then new.daily_rate := null; end if;
  if new.package = 'supercharge' then
    new.plan_days := 30;
  elsif new.package is distinct from 'daily' then
    new.plan_days := null;
  end if;
  if new.package is distinct from 'supercharge' then new.extra_track := null; end if;

  if new.package is not null and new.package <> 'presave' then
    new.release_date := null;
    new.reserve_release_spots := false;
  end if;

  select coalesce(nullif(p.artist_name, ''), nullif(p.full_name, '')) into new.artist_name
    from public.profiles p where p.id = new.user_id;
  select u.email into new.contact_email from auth.users u where u.id = new.user_id;
  return new;
end;
$function$;

create or replace function public.studio_campaign_guard_update()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    if (new.id, new.user_id, new.name, new.platform, new.goal, new.budget, new.spent,
        new.started_on, new.next_billing, new.payment_method, new.created_at,
        new.artist_name, new.contact_email, new.campaign_days,
        new.campaign_started_at, new.campaign_ends_at, new.reviewed_at, new.reviewed_by, new.review_note,
        new.package, new.daily_rate, new.plan_days, new.extra_track)
       is distinct from
       (old.id, old.user_id, old.name, old.platform, old.goal, old.budget, old.spent,
        old.started_on, old.next_billing, old.payment_method, old.created_at,
        old.artist_name, old.contact_email, old.campaign_days,
        old.campaign_started_at, old.campaign_ends_at, old.reviewed_at, old.reviewed_by, old.review_note,
        old.package, old.daily_rate, old.plan_days, old.extra_track) then
      raise exception 'Only RADR staff can change that';
    end if;
    if new.status is distinct from old.status then
      if new.status = 'removed' then
        raise exception 'Sent campaigns can only be removed by RADR staff';
      end if;
      if old.status = 'pending' then
        raise exception 'This campaign is waiting for RADR approval';
      end if;
      if old.status in ('removed', 'completed') then
        raise exception 'This campaign is closed';
      end if;
      if not (old.status in ('active', 'paused') and new.status in ('active', 'paused')) then
        raise exception 'Status change not allowed';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.studio_campaign_review_dates()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.status is distinct from old.status then
    if old.status = 'pending' and new.status = 'active' then
      new.campaign_days := coalesce(new.campaign_days, new.plan_days, 14);
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
$function$;
