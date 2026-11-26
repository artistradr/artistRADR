-- After a campaign is sent, artists may only pause or resume it. This adds the
-- name, platform, goal, budget and billing fields to the staff-only list, and
-- stops a new campaign arriving with billing details already filled in.

create or replace function public.studio_campaign_guard_update()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if auth.uid() is not null and not public.radr_is_staff() then
    if (new.id, new.user_id, new.name, new.platform, new.goal, new.budget, new.spent,
        new.started_on, new.next_billing, new.payment_method, new.created_at,
        new.artist_name, new.contact_email, new.campaign_days,
        new.campaign_started_at, new.campaign_ends_at, new.reviewed_at, new.reviewed_by, new.review_note)
       is distinct from
       (old.id, old.user_id, old.name, old.platform, old.goal, old.budget, old.spent,
        old.started_on, old.next_billing, old.payment_method, old.created_at,
        old.artist_name, old.contact_email, old.campaign_days,
        old.campaign_started_at, old.campaign_ends_at, old.reviewed_at, old.reviewed_by, old.review_note) then
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
  select coalesce(nullif(p.artist_name, ''), nullif(p.full_name, '')) into new.artist_name
    from public.profiles p where p.id = new.user_id;
  select u.email into new.contact_email from auth.users u where u.id = new.user_id;
  return new;
end;
$function$;
