// src/studio/pages/PlaylistDraft.jsx
//
// Draft for one RADR playlist: copy the live tracks in, search Spotify, add,
// remove and drag to reorder. Every track shows its number in the playlist.
// Nothing changes on Spotify until you review, approve and click Sync.
//
// Needs:  npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const fmt = (ms) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// supabase-js hides the JSON body of non-2xx function responses in error.context
async function functionError(error) {
  try {
    const body = await error.context.json();
    return body.error || error.message;
  } catch {
    return error.message;
  }
}

// Track number badge: position in the draft, updates live while dragging.
const numberStyle = {
  minWidth: 32,
  height: 28,
  padding: "0 6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 14,
  background: "rgba(128,128,128,0.18)",
  fontWeight: 700,
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  flexShrink: 0,
};

function SortableRow({ item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "6px 0",
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? "rgba(128,128,128,0.12)" : "transparent",
  };
  const t = item.tracks;

  return (
    <li ref={setNodeRef} style={style}>
      <button
        type="button"
        aria-label={`Drag to reorder ${t?.title ?? "track"}`}
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", background: "none", border: "none", fontSize: 18, touchAction: "none" }}
      >
        ⋮⋮
      </button>
      <span style={numberStyle} title={`Track ${index + 1} in the playlist`}>
        {index + 1}
      </span>
      {t?.artwork_url && <img src={t.artwork_url} alt="" width={40} height={40} />}
      <span style={{ flex: 1 }}>
        <strong>{t?.title}</strong>
        <br />
        <small>{(t?.artists ?? []).join(", ")}</small>
      </span>
      <small>{fmt(t?.duration_ms)}</small>
      <button type="button" className="rs-btn" onClick={() => onRemove(item.id)}>
        Remove
      </button>
    </li>
  );
}

export default function PlaylistDraft({ supabase, playlistId }) {
  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(""); // "preview" | "approve" | "sync" | "discard"

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadDraft = useCallback(async () => {
    const { data: d, error: dErr } = await supabase
      .from("playlist_drafts")
      .select("id, status, updated_at")
      .eq("playlist_id", playlistId)
      .in("status", ["draft", "ready", "approved"])
      .limit(1)
      .maybeSingle();
    if (dErr) {
      setError(dErr.message);
      setLoading(false);
      return;
    }
    setDraft(d);
    if (!d) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: rows, error: iErr } = await supabase
      .from("playlist_draft_items")
      .select("id, position, source, tracks(id, title, artists, album, duration_ms, artwork_url)")
      .eq("draft_id", d.id)
      .order("position");
    if (iErr) setError(iErr.message);
    else setItems(rows ?? []);
    setLoading(false);
  }, [supabase, playlistId]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Any reload of the draft items makes an old preview stale.
  useEffect(() => {
    setPreview(null);
  }, [items]);

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  // ── copy live playlist into draft ───────────────────────────────────────
  const seedFromPlaylist = async () => {
    clearMessages();
    setSeeding(true);
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "playlist_tracks", playlist_id: playlistId },
    });
    if (fnErr) {
      setError(await functionError(fnErr));
      setSeeding(false);
      return;
    }
    const { data: res, error: rpcErr } = await supabase.rpc("studio_seed_draft_from_tracks", {
      p_playlist_id: playlistId,
      p_tracks: data.tracks ?? [],
    });
    setSeeding(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    const parts = [`Copied ${res.added} track${res.added === 1 ? "" : "s"} into the draft.`];
    if (res.already_in_draft) parts.push(`${res.already_in_draft} already there.`);
    if (res.skipped) parts.push(`${res.skipped} local file${res.skipped === 1 ? "" : "s"} skipped.`);
    setNotice(parts.join(" "));
    await loadDraft();
  };

  // ── search / add / remove ───────────────────────────────────────────────
  const runSearch = async (e) => {
    e.preventDefault();
    clearMessages();
    setSearching(true);
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "search", query },
    });
    if (fnErr) {
      setError(await functionError(fnErr));
      setResults([]);
    } else {
      setResults(data.tracks ?? []);
    }
    setSearched(true);
    setSearching(false);
  };

  const addTrack = async (t) => {
    clearMessages();
    setAddingId(t.spotify_id);
    const { data, error: rpcErr } = await supabase.rpc("studio_add_track_to_draft", {
      p_playlist_id: playlistId,
      p_track: t,
      p_source: "manual",
    });
    setAddingId(null);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    setNotice(data?.added ? `Added "${t.name}" to the draft.` : `"${t.name}" is already in the draft.`);
    await loadDraft();
  };

  const removeItem = async (itemId) => {
    clearMessages();
    const { error: delErr } = await supabase.from("playlist_draft_items").delete().eq("id", itemId);
    if (delErr) setError(delErr.message);
    await loadDraft();
  };

  // ── review, approve, sync ───────────────────────────────────────────────
  const runPreview = async () => {
    if (!draft) return;
    clearMessages();
    setBusy("preview");
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "preview", draft_id: draft.id },
    });
    setBusy("");
    if (fnErr) {
      setError(await functionError(fnErr));
      setPreview(null);
      return;
    }
    setPreview(data);
  };

  const approve = async () => {
    if (!draft || !preview) return;
    clearMessages();
    setBusy("approve");
    const { error: rpcErr } = await supabase.rpc("studio_approve_draft", {
      p_draft_id: draft.id,
      p_live_hash: preview.live_hash,
      p_item_ids: preview.item_ids,
    });
    setBusy("");
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    await loadDraft();
    setNotice("Approved. Nothing has changed on Spotify yet. Click Sync to Spotify when ready.");
  };

  const syncNow = async () => {
    if (!draft) return;
    if (!window.confirm("Apply this approved draft to the live Spotify playlist now?")) return;
    clearMessages();
    setBusy("sync");
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "sync", draft_id: draft.id },
    });
    setBusy("");
    if (fnErr) {
      setError(await functionError(fnErr));
      await loadDraft();
      return;
    }
    const r = data.result ?? {};
    await loadDraft();
    setNotice(
      `Synced to Spotify. Added ${r.added ?? 0}, removed ${r.removed ?? 0}, reordered ${r.moved ?? 0}. ` +
        `The playlist now has ${r.final_count ?? "?"} tracks. Use "Show live tracks on Spotify" to see it.`,
    );
  };

  const discard = async () => {
    if (!draft) return;
    if (!window.confirm("Discard this draft? Spotify is not changed.")) return;
    clearMessages();
    setBusy("discard");
    const { error: rpcErr } = await supabase.rpc("studio_discard_draft", { p_draft_id: draft.id });
    setBusy("");
    if (rpcErr) setError(rpcErr.message);
    else setNotice("Draft discarded.");
    await loadDraft();
  };

  // ── drag to reorder ─────────────────────────────────────────────────────
  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id || !draft) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;

    const next = arrayMove(items, from, to);
    setItems(next); // optimistic
    clearMessages();
    const { error: rpcErr } = await supabase.rpc("studio_reorder_draft", {
      p_draft_id: draft.id,
      p_item_ids: next.map((i) => i.id),
    });
    if (rpcErr) {
      setError(rpcErr.message);
      await loadDraft(); // put the true order back
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 4px" }}>
        <h3 style={{ margin: 0, flex: 1 }}>Draft</h3>
        <button type="button" className="rs-btn" onClick={seedFromPlaylist} disabled={seeding}>
          {seeding ? "Copying…" : "Copy current playlist into draft"}
        </button>
      </div>
      <p style={{ margin: "0 0 8px", opacity: 0.7 }}>
        Draft only. Nothing changes on Spotify until you review, approve and click Sync.
      </p>

      {error && <div className="rs-alert error">{error}</div>}
      {notice && <div className="rs-alert">{notice}</div>}

      {loading ? (
        <p>Loading draft…</p>
      ) : items.length === 0 ? (
        <p>No tracks in the draft yet. Copy the current playlist, or search below and add some.</p>
      ) : (
        <>
          <p>
            {items.length} track{items.length === 1 ? "" : "s"} in draft · numbers show the playlist
            order · drag ⋮⋮ to reorder
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {items.map((it, i) => (
                  <SortableRow key={it.id} item={it} index={i} onRemove={removeItem} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </>
      )}

      {draft && items.length > 0 && (
        <div
          style={{
            margin: "16px 0",
            padding: 12,
            border: "1px solid rgba(128,128,128,0.35)",
            borderRadius: 8,
          }}
        >
          <h3 style={{ margin: "0 0 4px" }}>Review and sync</h3>
          <p style={{ margin: "0 0 8px" }}>
            Draft status: <strong>{draft.status === "ready" ? "draft" : draft.status}</strong>
            {draft.status === "approved" && " · any edit to the draft cancels the approval"}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="rs-btn" onClick={runPreview} disabled={!!busy}>
              {busy === "preview" ? "Checking Spotify…" : "Review changes"}
            </button>
            {draft.status === "approved" && (
              <button type="button" className="rs-btn primary" onClick={syncNow} disabled={!!busy}>
                {busy === "sync" ? "Syncing…" : "Sync to Spotify"}
              </button>
            )}
            <button type="button" className="rs-btn" onClick={discard} disabled={!!busy}>
              Discard draft
            </button>
          </div>

          {preview && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 4px" }}>
                <strong>
                  {preview.live_count} tracks on Spotify now → {preview.final_count} after sync
                </strong>
              </p>
              <p style={{ margin: "0 0 8px" }}>
                Adding {preview.adds.length} · Removing {preview.removes.length} · Reordered {preview.moved}
              </p>

              {preview.adds.length > 0 && (
                <details open>
                  <summary>Adding ({preview.adds.length})</summary>
                  <ol>
                    {preview.adds.map((t, i) => (
                      <li key={`a${i}`}>
                        {t.name} <small>{t.artists.join(", ")}</small>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {preview.removes.length > 0 && (
                <details open>
                  <summary>Removing ({preview.removes.length})</summary>
                  <ol>
                    {preview.removes.map((t, i) => (
                      <li key={`r${i}`}>
                        {t.name} <small>{t.artists.join(", ")}</small>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {preview.adds.length === 0 && preview.removes.length === 0 && preview.moved === 0 && (
                <p>No changes: the draft already matches the live playlist.</p>
              )}

              {preview.blocked.length > 0 && (
                <div className="rs-alert error" style={{ marginTop: 8 }}>
                  Can't sync yet:
                  <ul style={{ margin: "4px 0 0" }}>
                    {preview.blocked.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.status !== "approved" && (
                <button
                  type="button"
                  className="rs-btn primary"
                  style={{ marginTop: 8 }}
                  onClick={approve}
                  disabled={!!busy || preview.blocked.length > 0}
                >
                  {busy === "approve" ? "Approving…" : "Approve these changes"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <h3 style={{ margin: "16px 0 4px" }}>Search Spotify</h3>
      <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Song or artist"
          minLength={2}
          maxLength={100}
          style={{ flex: 1, padding: "6px 8px" }}
        />
        <button type="submit" className="rs-btn primary" disabled={searching || query.trim().length < 2}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && !searching && <p>No results.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {results.map((t) => (
          <li
            key={t.spotify_id}
            style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0" }}
          >
            {t.image && <img src={t.image} alt="" width={40} height={40} />}
            <span style={{ flex: 1 }}>
              <strong>{t.name}</strong>
              <br />
              <small>
                {t.artists.join(", ")}
                {t.album ? ` · ${t.album}` : ""}
              </small>
            </span>
            <small>{fmt(t.duration_ms)}</small>
            <button
              type="button"
              className="rs-btn"
              onClick={() => addTrack(t)}
              disabled={addingId === t.spotify_id}
            >
              {addingId === t.spotify_id ? "Adding…" : "Add to draft"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}