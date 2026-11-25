-- Artists cannot delete or remove a campaign once it has been sent to RADR.
-- Only RADR staff can remove campaigns (staff keep their UPDATE policy).

drop policy if exists "Users can delete their own campaigns" on public.campaigns;

create or replace function public.studio_campaign_guard_update()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
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
