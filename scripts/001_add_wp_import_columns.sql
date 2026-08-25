-- Migration: add_wp_import_columns
-- Purpose: support idempotent WordPress -> Supabase post migration.
-- Additive only — does not touch existing columns, RLS, or policies.
--
-- wp_id: the numeric WordPress post ID. Used as the upsert key so the
--   migration script can be re-run safely (updates existing rows instead
--   of creating duplicates).
-- author_name: WP authors don't map to any auth.users / profiles row,
--   so this stores the plain display name pulled from the WP REST API
--   at import time. Falls back to "Artist RADR" in the front end when null.

alter table posts
  add column if not exists wp_id bigint unique,
  add column if not exists author_name text;

comment on column posts.wp_id is 'Source WordPress post ID, used for idempotent re-import. Null for posts authored natively in the new admin.';
comment on column posts.author_name is 'Plain-text author display name imported from WordPress. Natively-authored posts should use author_id -> profiles instead.';
