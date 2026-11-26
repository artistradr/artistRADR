-- Campaign packages. release_date and reserve_release_spots already exist
-- (migration 20261126072323_campaigns_release_day_reserve).
-- A new campaign with a package must match that package's price and length.
-- A campaign without a package (the older form) behaves as before.
-- Prices and lengths also live in src/pages/campaigns/packages.js.

alter table public.campaigns add column package text;
alter table public.campaigns add constraint campaigns_package_check
  check (package is null or package in ('weekly','two_weeks','monthly','custom','presave'));

create or replace function public.studio_campaign_force_pending()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  requested_days integer := new.campaign_days;
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

  if new.package in ('weekly','two_weeks','monthly') then
    if new.budget is distinct from (case new.package when 'weekly' then 25 when 'two_weeks' then 50 else 100 end) then
      raise exception 'That price does not match the package';
    end if;
    new.campaign_days := case new.package when 'weekly' then 7 when 'two_weeks' then 14 else 30 end;
  elsif new.package in ('custom','presave') then
    if new.budget is null or new.budget < 50 then
      raise exception 'The minimum budget for this campaign is $50';
    end if;
    if new.package = 'custom' then
      if requested_days is null or requested_days not in (7,14,30,60) then
        raise exception 'Choose a campaign length';
      end if;
      new.campaign_days := requested_days;
    elsif new.release_date is null or new.release_date < current_date then
      raise exception 'A pre-save campaign needs an upcoming release date';
    end if;
  end if;

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
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    if (new.id, new.user_id, new.name, new.platform, new.goal, new.budget, new.spent,
        new.started_on, new.next_billing, new.payment_method, new.created_at,
        new.artist_name, new.contact_email, new.campaign_days,
        new.campaign_started_at, new.campaign_ends_at, new.reviewed_at, new.reviewed_by, new.review_note,
        new.package)
       is distinct from
       (old.id, old.user_id, old.name, old.platform, old.goal, old.budget, old.spent,
        old.started_on, old.next_billing, old.payment_method, old.created_at,
        old.artist_name, old.contact_email, old.campaign_days,
        old.campaign_started_at, old.campaign_ends_at, old.reviewed_at, old.reviewed_by, old.review_note,
        old.package) then
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
