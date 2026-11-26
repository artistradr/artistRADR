-- Records the USD price and exchange rate used for each payment (USD prices charged in NGN).
-- Rebuilt from the live column types on 2026-11-26: the original file was not saved.
alter table public.payments
  add column if not exists price_usd numeric(12,2),
  add column if not exists fx_rate numeric(18,6);
