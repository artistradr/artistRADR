-- Hourly job that resolves campaigns whose time is up.
create extension if not exists pg_cron;
select cron.schedule('studio-resolve-campaigns', '0 * * * *', $$select public.studio_resolve_expired_campaigns()$$);
