// src/studio/pages/DiscoveryPage.jsx
//
// Discovery: collect track candidates (found by hand or via Spotify search),
// review them (save / reject), and accept them into a playlist DRAFT.
// Accepting never changes Spotify. The draft still needs review, approval and sync.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import SpotifySearch, { formatRelease } from "./SpotifySearch";
import InstagramPanel from "./InstagramPanel";
import "./playlists.css";

const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString() : "");

const SOURCE_KINDS = ["manual", "playlist", "blog", "chart", "social", "other"];

// ── One candidate row ─────────────────────────────────────────────────────────
function CandidateRow({
  c,
  sourceName,
  playlists,
  playlistTitle,
  busy,
  onSave,
  onReject,
  onRestore,
  onAccept,
  onAttach,
}) {
  const [matching, setMatching] = useState(false);
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id ?? "");
  const sp = c.spotify_track;
  const hasMatch = !!sp?.spotify_id;
  const open = c.status === "new" || c.status === "saved";

  return (
    <li style={{ padding: "10px 0", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {sp?.image && <img src={sp.image} alt="" width={40} height={40} />}
        <span style={{ flex: 1 }}>
          <strong>{c.track_title}</strong>
          <br />
          <small>
            {c.artist_name}
            {sp?.album ? ` · ${sp.album}` : ""}
            {sp?.release_date ? ` · Released ${formatRelease(sp.release_date)}` : ""}
          </small>
        </span>
        <span className="rs-chip">{c.status}</span>
        <span className="rs-chip">{hasMatch ? "Spotify match" : "No Spotify match"}</span>
      </div>

      <div style={{ margin: "4px 0 0", opacity: 0.75 }}>
        <small>
          {sourceName ? `Source: ${sourceName} · ` : ""}Added {fmtTime(c.created_at)}
          {c.link_url && (
            <>
              {" · "}
              <a href={c.link_url} target="_blank" rel="noopener noreferrer">
                Link
              </a>
            </>
          )}
        </small>
        {c.note && <div>{c.note}</div>}
      </div>

      {c.status === "accepted" && (
        <div style={{ marginTop: 4 }}>
          <small>
            Added to the draft{playlistTitle ? ` of ${playlistTitle}` : ""}. Open that playlist to review and sync.
          </small>
        </div>
      )}

      {open && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
          {hasMatch && (
            <>
              <select
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                style={{ padding: "6px 8px" }}
                aria-label="Playlist draft to add to"
              >
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rs-btn primary"
                onClick={() => onAccept(c, playlistId)}
                disabled={busy || !playlistId}
              >
                Accept into draft
              </button>
            </>
          )}
          {!hasMatch && (
            <button type="button" className="rs-btn" onClick={() => setMatching((v) => !v)}>
              {matching ? "Close search" : "Match on Spotify"}
            </button>
          )}
          {c.status === "new" && (
            <button type="button" className="rs-btn" onClick={() => onSave(c)} disabled={busy}>
              Save for later
            </button>
          )}
          <button type="button" className="rs-btn" onClick={() => onReject(c)} disabled={busy}>
            Reject
          </button>
        </div>
      )}

      {c.status === "rejected" && (
        <div style={{ marginTop: 8 }}>
          <button type="button" className="rs-btn" onClick={() => onRestore(c)} disabled={busy}>
            Restore
          </button>
        </div>
      )}

      {open && !hasMatch && matching && (
        <div style={{ marginTop: 8 }}>
          <SpotifySearch
            supabase={supabase}
            initialQuery={`${c.track_title} ${c.artist_name}`.trim().slice(0, 100)}
            pickLabel="Use this match"
            onPick={async (t) => {
              await onAttach(c, t);
              setMatching(false);
            }}
          />
        </div>
      )}
    </li>
  );
}

export default function DiscoveryPage() {
  const [candidates, setCandidates] = useState([]);
  const [sources, setSources] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("open"); // open | accepted | rejected | all

  // add-candidate form (shared by Spotify search and manual entry)
  const [sourceId, setSourceId] = useState("");
  const [note, setNote] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [mArtist, setMArtist] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mLink, setMLink] = useState("");
  const [addingKey, setAddingKey] = useState(null);

  // sources panel
  const [showSources, setShowSources] = useState(false);
  const [sName, setSName] = useState("");
  const [sKind, setSKind] = useState("blog");
  const [sUrl, setSUrl] = useState("");

  const load = useCallback(async () => {
    const [cand, src, pl] = await Promise.all([
      supabase
        .from("discovery_candidates")
        .select("id, status, artist_name, track_title, link_url, note, spotify_track, source_id, accepted_playlist_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("discovery_sources").select("id, name, kind, url, is_active").order("name"),
      supabase
        .from("radr_playlists")
        .select("id, title")
        .eq("platform", "spotify")
        .eq("is_archived", false)
        .order("title"),
    ]);
    const err = cand.error || src.error || pl.error;
    if (err) setError(err.message);
    else {
      setCandidates(cand.data ?? []);
      setSources(src.data ?? []);
      setPlaylists(pl.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const sourceName = useMemo(() => new Map(sources.map((s) => [s.id, s.name])), [sources]);
  const playlistTitle = useMemo(() => new Map(playlists.map((p) => [p.id, p.title])), [playlists]);
  const activeSources = sources.filter((s) => s.is_active);

  const visible = candidates.filter((c) => {
    if (filter === "open") return c.status === "new" || c.status === "saved";
    if (filter === "all") return true;
    return c.status === filter;
  });

  // ── add candidates ──────────────────────────────────────────────────────
  const insertCandidate = async (row) => {
    const { data: u } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("discovery_candidates").insert({
      ...row,
      source_id: sourceId || null,
      note: note.trim() || null,
      created_by: u?.user?.id ?? null,
    });
    return insErr;
  };

  const addFromSpotify = async (t) => {
    clearMessages();
    const dupe = candidates.find(
      (c) => c.spotify_track?.spotify_id === t.spotify_id && c.status !== "rejected",
    );
    if (dupe) {
      setNotice(`"${t.name}" is already a candidate (${dupe.status}).`);
      return;
    }
    setAddingKey(t.spotify_id);
    const insErr = await insertCandidate({
      artist_name: t.artists.join(", "),
      track_title: t.name,
      spotify_track: t,
    });
    setAddingKey(null);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setNotice(`Added "${t.name}" as a candidate.`);
    await load();
  };

  const addManual = async (e) => {
    e.preventDefault();
    clearMessages();
    setAddingKey("manual");
    const insErr = await insertCandidate({
      artist_name: mArtist.trim(),
      track_title: mTitle.trim(),
      link_url: mLink.trim() || null,
    });
    setAddingKey(null);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setNotice(`Added "${mTitle.trim()}" as a candidate. Match it on Spotify before accepting.`);
    setMArtist("");
    setMTitle("");
    setMLink("");
    await load();
  };

  // ── review actions ──────────────────────────────────────────────────────
  const setStatus = async (c, status) => {
    clearMessages();
    setBusyId(c.id);
    const { error: upErr } = await supabase
      .from("discovery_candidates")
      .update({ status })
      .eq("id", c.id);
    setBusyId(null);
    if (upErr) setError(upErr.message);
    await load();
  };

  const attachMatch = async (c, t) => {
    clearMessages();
    setBusyId(c.id);
    const { error: upErr } = await supabase
      .from("discovery_candidates")
      .update({ spotify_track: t })
      .eq("id", c.id);
    setBusyId(null);
    if (upErr) setError(upErr.message);
    else setNotice(`Matched "${c.track_title}" to "${t.name}" on Spotify.`);
    await load();
  };

  const accept = async (c, playlistId) => {
    clearMessages();
    setBusyId(c.id);
    const { data, error: rpcErr } = await supabase.rpc("studio_accept_candidate", {
      p_candidate_id: c.id,
      p_playlist_id: playlistId,
    });
    setBusyId(null);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    const where = playlistTitle.get(playlistId) ?? "the playlist";
    setNotice(
      data?.added
        ? `Added "${c.track_title}" to the draft of ${where}. Nothing has changed on Spotify.`
        : `"${c.track_title}" was already in the draft of ${where}.`,
    );
    await load();
  };

  // ── sources ──────────────────────────────────────────────────────────────
  const addSource = async (e) => {
    e.preventDefault();
    clearMessages();
    const { data: u } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("discovery_sources").insert({
      name: sName.trim(),
      kind: sKind,
      url: sUrl.trim() || null,
      created_by: u?.user?.id ?? null,
    });
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setSName("");
    setSUrl("");
    await load();
  };

  const toggleSource = async (s) => {
    clearMessages();
    const { error: upErr } = await supabase
      .from("discovery_sources")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (upErr) setError(upErr.message);
    await load();
  };

  return (
    <>
      <div className="rs-head">
        <h1 className="rs-h1">Discovery</h1>
        <span className="rs-chip next">Phase 3</span>
      </div>
      <p className="rs-sub">
        Collect tracks worth considering, review them, and accept the good ones into a playlist draft.
        Accepting only adds to the draft. Nothing changes on Spotify until you review, approve and sync.
      </p>

      {error && <div className="rs-alert error">{error}</div>}
      {notice && <div className="rs-alert">{notice}</div>}

      <div className="rs-panel">
        <h2>Add a candidate</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            style={{ padding: "6px 8px" }}
            aria-label="Where you found it"
          >
            <option value="">Source (optional)</option>
            {activeSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            maxLength={300}
            style={{ flex: 1, minWidth: 200, padding: "6px 8px" }}
          />
        </div>

        <SpotifySearch supabase={supabase} pickLabel="Add as candidate" onPick={addFromSpotify} busyKey={addingKey} />

        <div style={{ marginTop: 8 }}>
          <button type="button" className="rs-btn" onClick={() => setShowManual((v) => !v)}>
            {showManual ? "Hide manual entry" : "Can't find it on Spotify? Add by hand"}
          </button>
        </div>
        {showManual && (
          <form onSubmit={addManual} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input
              type="text"
              value={mArtist}
              onChange={(e) => setMArtist(e.target.value)}
              placeholder="Artist"
              required
              maxLength={200}
              style={{ flex: 1, minWidth: 160, padding: "6px 8px" }}
            />
            <input
              type="text"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="Track title"
              required
              maxLength={200}
              style={{ flex: 1, minWidth: 160, padding: "6px 8px" }}
            />
            <input
              type="url"
              value={mLink}
              onChange={(e) => setMLink(e.target.value)}
              placeholder="Link (optional)"
              style={{ flex: 1, minWidth: 200, padding: "6px 8px" }}
            />
            <button
              type="submit"
              className="rs-btn primary"
              disabled={addingKey === "manual" || !mArtist.trim() || !mTitle.trim()}
            >
              {addingKey === "manual" ? "Adding…" : "Add candidate"}
            </button>
          </form>
        )}
      </div>

      <div className="rs-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h2 style={{ margin: 0, marginRight: 8 }}>Candidates</h2>
          {[
            ["open", "To review"],
            ["accepted", "Accepted"],
            ["rejected", "Rejected"],
            ["all", "All"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "rs-btn primary" : "rs-btn"}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : visible.length === 0 ? (
          <p>Nothing here yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {visible.map((c) => (
              <CandidateRow
                key={c.id}
                c={c}
                sourceName={sourceName.get(c.source_id)}
                playlists={playlists}
                playlistTitle={playlistTitle.get(c.accepted_playlist_id)}
                busy={busyId === c.id}
                onSave={(x) => setStatus(x, "saved")}
                onReject={(x) => setStatus(x, "rejected")}
                onRestore={(x) => setStatus(x, "new")}
                onAccept={accept}
                onAttach={attachMatch}
              />
            ))}
          </ul>
        )}
      </div>

      <InstagramPanel />

      <div className="rs-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, flex: 1 }}>Sources</h2>
          <button type="button" className="rs-btn" onClick={() => setShowSources((v) => !v)}>
            {showSources ? "Hide sources" : "Manage sources"}
          </button>
        </div>
        {showSources && (
          <div style={{ marginTop: 8 }}>
            <form onSubmit={addSource} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <input
                type="text"
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                placeholder="Source name"
                required
                maxLength={120}
                style={{ flex: 1, minWidth: 160, padding: "6px 8px" }}
              />
              <select value={sKind} onChange={(e) => setSKind(e.target.value)} style={{ padding: "6px 8px" }}>
                {SOURCE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={sUrl}
                onChange={(e) => setSUrl(e.target.value)}
                placeholder="URL (optional)"
                style={{ flex: 1, minWidth: 200, padding: "6px 8px" }}
              />
              <button type="submit" className="rs-btn primary" disabled={!sName.trim()}>
                Add source
              </button>
            </form>
            {sources.length === 0 ? (
              <p>No sources yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {sources.map((s) => (
                  <li
                    key={s.id}
                    style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", opacity: s.is_active ? 1 : 0.5 }}
                  >
                    <strong style={{ flex: 1 }}>{s.name}</strong>
                    <span className="rs-chip">{s.kind}</span>
                    {s.url && (
                      <a className="rs-btn" href={s.url} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    )}
                    <button type="button" className="rs-btn" onClick={() => toggleSource(s)}>
                      {s.is_active ? "Disable" : "Enable"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}