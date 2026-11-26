-- Payment records for the artist Billing page (/campaigns/billing).
-- Applied to the remote project on 2026-11-26.
-- Artists can only read their own rows. Staff can read, add and update.
-- There is no delete policy: correct a payment by changing its status.

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete restrict,
  campaign_id uuid references public.campaigns (id) on delete set null,
  amount      numeric(12,2) not null check (amount > 0),
  currency    text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status      text not null default 'pending'
              check (status in ('pending', 'paid', 'failed', 'refunded')),
  method      text,
  reference   text unique,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index payments_user_created_idx on public.payments (user_id, created_at desc);
create index payments_campaign_idx on public.payments (campaign_id);

alter table public.payments enable row level security;

revoke all on public.payments from anon, authenticated;
grant select, insert, update on public.payments to authenticated;

create policy "Users can view their own payments" on public.payments
  for select to authenticated using (auth.uid() = user_id);

create policy "Staff can view all payments" on public.payments
  for select to authenticated using (public.radr_is_staff());

create policy "Staff can add payments" on public.payments
  for insert to authenticated with check (public.radr_is_staff());

create policy "Staff can update payments" on public.payments
  for update to authenticated using (public.radr_is_staff()) with check (public.radr_is_staff());
