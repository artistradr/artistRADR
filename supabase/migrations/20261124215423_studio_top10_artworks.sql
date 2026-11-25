-- Studio: approved Top 10 artwork library (staff only).

insert into storage.buckets (id, name, public)
values ('studio-artwork', 'studio-artwork', false)
on conflict (id) do nothing;

drop policy if exists "staff manage studio artwork" on storage.objects;
create policy "staff manage studio artwork" on storage.objects
  for all to authenticated
  using (bucket_id = 'studio-artwork' and public.radr_is_staff())
  with check (bucket_id = 'studio-artwork' and public.radr_is_staff());

create table if not exists public.top10_artworks (
  id            uuid primary key default gen_random_uuid(),
  playlist_id   uuid references public.radr_playlists(id) on delete set null,
  header_label  text not null,
  title_line    text not null,
  date_label    text not null,
  tracks        jsonb not null,
  dark_path     text not null,
  light_path    text not null,
  status        text not null default 'approved' check (status in ('approved', 'archived')),
  approved_by   uuid references auth.users(id) on delete set null,
  approved_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.top10_artworks enable row level security;
drop policy if exists "staff full access" on public.top10_artworks;
create policy "staff full access" on public.top10_artworks
  for all to authenticated
  using (public.radr_is_staff()) with check (public.radr_is_staff());
