-- Spotlight consideration submissions.
-- Already applied to the artistradr project on 2026-11-27 (via the Supabase MCP);
-- kept here so the repo matches the database. Do not run it a second time.

create table public.spotlight_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  artist_name text not null check (char_length(artist_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  bio text not null check (char_length(bio) between 1 and 1500),
  featured_track_url text not null check (featured_track_url ~ '^https://open\.spotify\.com/' and char_length(featured_track_url) <= 300),
  instagram_url text check (instagram_url is null or (instagram_url ~ '^https://' and char_length(instagram_url) <= 300)),
  photo_url text check (photo_url is null or (photo_url ~ '^https://' and char_length(photo_url) <= 500)),
  other_links text check (other_links is null or char_length(other_links) <= 1000),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'open' check (status in ('open', 'approved', 'rejected', 'resolved')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text
);

create index spotlight_submissions_user_idx on public.spotlight_submissions (user_id, submitted_at desc);
create index spotlight_submissions_status_idx on public.spotlight_submissions (status, submitted_at desc);

alter table public.spotlight_submissions enable row level security;

create policy "spotlight: artists insert own"
  on public.spotlight_submissions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'open'
    and reviewed_at is null
    and reviewed_by is null
    and review_note is null
  );

create policy "spotlight: artists read own"
  on public.spotlight_submissions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "spotlight: staff read all"
  on public.spotlight_submissions for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'radrStaff'));

create policy "spotlight: staff review"
  on public.spotlight_submissions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'radrStaff'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'radrStaff'));
