-- Saved from the remote database on 2026-11-26 (applied as version 20261126072323).

alter table public.campaigns
  add column if not exists release_date date,
  add column if not exists reserve_release_spots boolean not null default false;

alter table public.campaigns
  add constraint campaigns_release_reserve_needs_date
  check (reserve_release_spots = false or release_date is not null);

create or replace function public.campaigns_lock_release_fields()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if auth.uid() is not null and not public.radr_is_staff()
     and (new.release_date is distinct from old.release_date
          or new.reserve_release_spots is distinct from old.reserve_release_spots) then
    raise exception 'Only RADR staff can change that';
  end if;
  return new;
end;
$$;

revoke all on function public.campaigns_lock_release_fields() from public, anon, authenticated;

drop trigger if exists campaigns_lock_release_fields on public.campaigns;
create trigger campaigns_lock_release_fields
  before update on public.campaigns
  for each row execute function public.campaigns_lock_release_fields();
