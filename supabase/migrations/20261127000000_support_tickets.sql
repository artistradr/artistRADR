-- Support tickets for signed-in users (/support).
-- NOT YET APPLIED to the remote project. After applying, rename this file to
-- the version Supabase records.
-- Users can create tickets and read their own. Only staff can change them.
-- There is no delete policy.

create table public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category    text not null check (category in ('campaign', 'billing', 'submission', 'account', 'other')),
  subject     text not null check (char_length(btrim(subject)) between 3 and 120),
  message     text not null check (char_length(btrim(message)) between 10 and 4000),
  status      text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  staff_reply text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index support_tickets_user_created_idx on public.support_tickets (user_id, created_at desc);

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

revoke all on public.support_tickets from anon, authenticated;
grant select on public.support_tickets to authenticated;
-- Column grants: a new ticket can't set its own status, reply or dates.
grant insert (user_id, category, subject, message) on public.support_tickets to authenticated;
grant update (status, staff_reply) on public.support_tickets to authenticated;

create policy "Users can view their own tickets" on public.support_tickets
  for select to authenticated using (auth.uid() = user_id);

create policy "Staff can view all tickets" on public.support_tickets
  for select to authenticated using (public.radr_is_staff());

create policy "Users can create their own tickets" on public.support_tickets
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Staff can update tickets" on public.support_tickets
  for update to authenticated using (public.radr_is_staff()) with check (public.radr_is_staff());
