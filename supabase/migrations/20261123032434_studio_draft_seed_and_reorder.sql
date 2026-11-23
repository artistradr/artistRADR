-- Copy a playlist's live tracks into its open draft (source = 'existing').
-- Tracks without a spotify_id (local files) are skipped and counted.
create or replace function public.studio_seed_draft_from_tracks(
  p_playlist_id uuid,
  p_tracks jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  t jsonb;
  v_added int := 0;
  v_skipped int := 0;
  v_dupes int := 0;
  v_res jsonb;
  v_draft uuid;
begin
  if not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_tracks) <> 'array' then
    raise exception 'p_tracks must be a JSON array';
  end if;

  for t in select * from jsonb_array_elements(p_tracks) loop
    if nullif(t->>'spotify_id', '') is null then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_res := public.studio_add_track_to_draft(p_playlist_id, t, 'existing');
    v_draft := (v_res->>'draft_id')::uuid;
    if (v_res->>'added')::boolean then
      v_added := v_added + 1;
    else
      v_dupes := v_dupes + 1;
    end if;
  end loop;

  return jsonb_build_object('draft_id', v_draft, 'added', v_added, 'already_in_draft', v_dupes, 'skipped', v_skipped);
end;
$$;

-- Save a new order for a draft. p_item_ids must be exactly the draft's item ids.
create or replace function public.studio_reorder_draft(
  p_draft_id uuid,
  p_item_ids uuid[]
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected int;
  v_matched int;
begin
  if not public.radr_is_staff() then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  perform 1 from public.playlist_drafts where id = p_draft_id for update;
  if not found then
    raise exception 'draft not found';
  end if;

  select count(*) into v_expected from public.playlist_draft_items where draft_id = p_draft_id;
  select count(*) into v_matched
  from public.playlist_draft_items
  where draft_id = p_draft_id and id = any(p_item_ids);

  if coalesce(array_length(p_item_ids, 1), 0) <> v_expected or v_matched <> v_expected then
    raise exception 'order does not match the draft (draft changed, reload and try again)';
  end if;

  update public.playlist_draft_items i
  set position = o.ord - 1
  from unnest(p_item_ids) with ordinality as o(id, ord)
  where i.id = o.id and i.draft_id = p_draft_id;

  update public.playlist_drafts set updated_at = now() where id = p_draft_id;
end;
$$;

revoke all on function public.studio_seed_draft_from_tracks(uuid, jsonb) from public, anon;
revoke all on function public.studio_reorder_draft(uuid, uuid[]) from public, anon;
grant execute on function public.studio_seed_draft_from_tracks(uuid, jsonb) to authenticated;
grant execute on function public.studio_reorder_draft(uuid, uuid[]) to authenticated;
