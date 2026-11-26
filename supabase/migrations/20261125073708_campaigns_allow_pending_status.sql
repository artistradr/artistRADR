-- Saved from the remote database on 2026-11-26 (applied as version 20261125073708).

alter table public.campaigns drop constraint campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check
  check (status = any (array['pending'::text, 'active'::text, 'paused'::text, 'completed'::text, 'removed'::text]));
