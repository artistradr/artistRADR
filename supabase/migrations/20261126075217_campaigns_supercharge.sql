-- Packages are now starter, basic, supercharge ($100 to $999) and presave, with
-- no artist-chosen duration. Staff set the number of days when they approve.
-- No saved campaign used the earlier package names.
-- Prices and limits also live in src/pages/campaigns/packages.js.

alter table public.campaigns drop constraint campaigns_package_check;
alter table public.campaigns add constraint campaigns_package_check
  check (package is null or package in ('starter','basic','supercharge','presave'));

create or replace function public.studio_campaign_force_pending()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
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
