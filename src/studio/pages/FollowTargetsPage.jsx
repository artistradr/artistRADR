// src/studio/pages/FollowTargetsPage.jsx
//
// Manage what a user follows on Spotify when they connect during playlist submission.
// The MAIN target (Artist RADR) is the only follow the site shows, and the only one that can
// fail the step. Every other active target is followed quietly by the follow-on-spotify edge
// function, best effort. Order here is the order they are followed in.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./playlists.css";
import "./campaigns.css";
import "./followTargetsPage.css";

const KIND_LABEL = { user: "Profile", playlist: "Playlist", artist: "Artist" };

// Accepts an open.spotify.com link or a spotify: URI for a user, playlist or artist.
export function parseSpotifyLink(input) {
  const s = (input || "").trim();
  let m = s.match(/^spotify:(user|playlist|artist):([A-Za-z0-9._-]+)$/);
  if (!m) m = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(user|playlist|artist)\/([A-Za-z0-9._-]+)/);
  return m ? { kind: m[1], spotify_id: m[2] } : null;
}

function spotifyUrl(t) {
  return `https://open.spotify.com/${t.kind}/${t.spotify_id}`;
}

export default function FollowTargetsPage() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const [label, setLabel] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("spotify_follow_targets")
      .select("id, kind, spotify_id, label, is_primary, active, position")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    else setTargets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = targets.filter((t) => t.active);
    return {
      main: targets.find((t) => t.is_primary),
      hiddenActive: active.filter((t) => !t.is_primary).length,
    };
  }, [targets]);

  // Runs one change, then reloads. Keeps error and notice state in one place.
  const run = async (fn, okMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: err } = await fn();
      if (err) throw err;
      if (okMessage) setNotice(okMessage);
      await load();
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    }
    setBusy(false);
  };

  const add = async (e) => {
    e.preventDefault();
    const parsed = parseSpotifyLink(link);
    if (!parsed) {
      setError("Paste a Spotify profile, playlist or artist link (open.spotify.com/...) or a spotify: URI.");
      return;
    }
    const nextPos = targets.reduce((n, t) => Math.max(n, t.position), -1) + 1;
    await run(
      () =>
        supabase.from("spotify_follow_targets").insert({
          ...parsed,
          label: label.trim(),
          is_primary: targets.length === 0,
          position: nextPos,
        }),
      "Added. New connections will follow it too."
    );
    setLink("");
    setLabel("");
  };

  const toggleActive = (t) =>
    run(() => supabase.from("spotify_follow_targets").update({ active: !t.active }).eq("id", t.id));

  const makeMain = (t) =>
    run(() => supabase.rpc("spotify_follow_set_primary", { target_id: t.id }), `${t.label || t.spotify_id} is now the main follow.`);

  const remove = (t) => {
    if (!window.confirm(`Remove ${t.label || t.spotify_id}? New connections will no longer follow it.`)) return;
    run(() => supabase.from("spotify_follow_targets").delete().eq("id", t.id));
  };

  const move = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= targets.length) return;
    const order = [...targets];
    [order[index], order[to]] = [order[to], order[index]];
    // Renumber every row so duplicate positions can never leave the order ambiguous.
    const changed = order.map((t, i) => ({ t, i })).filter(({ t, i }) => t.position !== i);
    run(async () => {
      const results = await Promise.all(
        changed.map(({ t, i }) => supabase.from("spotify_follow_targets").update({ position: i }).eq("id", t.id))
      );
      return { error: results.find((r) => r.error)?.error ?? null };
    });
  };

  return (
    <div className="rc-page">
      <div className="rc-head">
        <div>
          <h1 className="rs-h1">Spotify follows</h1>
          <p className="rs-sub" style={{ marginBottom: 0 }}>
            What someone follows on Spotify when they connect during playlist submission. They only see the main
            follow. Everything else is followed quietly in the background, and a failure there never shows.
          </p>
        </div>
        <button type="button" className="rs-btn" onClick={load} disabled={busy}>Refresh</button>
      </div>

      <div className="ft-summary">
        <div className="ft-summary-row">
          <span className="ft-summary-k">Shown to users</span>
          <strong>{stats.main ? stats.main.label || stats.main.spotify_id : "No main follow set"}</strong>
        </div>
        <div className="ft-summary-row">
          <span className="ft-summary-k">Followed in the background</span>
          <strong>{stats.hiddenActive}</strong>
        </div>
      </div>

      {error && <div className="rs-alert error">{error}</div>}
      {notice && <div className="rs-alert">{notice}</div>}

      <form className="ft-add" onSubmit={add}>
        <input
          className="rc-input ft-link"
          type="text"
          placeholder="Paste a Spotify profile, playlist or artist link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          aria-label="Spotify link"
        />
        <input
          className="rc-input ft-label"
          type="text"
          placeholder="Name (for you only)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Name"
        />
        <button type="submit" className="rs-btn" disabled={busy || !link.trim()}>Add</button>
      </form>

      {loading ? (
        <div className="rc-empty">Loading…</div>
      ) : targets.length === 0 ? (
        <div className="rc-empty">Nothing to follow yet. Add the Artist RADR profile first, it becomes the main follow.</div>
      ) : (
        <ul className="ft-list">
          {targets.map((t, i) => (
            <li key={t.id} className={`ft-row${t.active ? "" : " off"}`}>
              <div className="ft-main">
                <div className="ft-name">
                  <strong>{t.label || t.spotify_id}</strong>
                  <span className="rs-chip">{KIND_LABEL[t.kind] ?? t.kind}</span>
                  {t.is_primary ? (
                    <span className="rs-chip ft-chip-main">Main, shown to users</span>
                  ) : (
                    <span className="rs-chip">{t.active ? "Background" : "Paused"}</span>
                  )}
                </div>
                <a className="ft-id" href={spotifyUrl(t)} target="_blank" rel="noreferrer">
                  {t.kind}:{t.spotify_id}
                </a>
              </div>
              <div className="ft-actions">
                <button type="button" className="rs-btn" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move up">↑</button>
                <button type="button" className="rs-btn" onClick={() => move(i, 1)} disabled={busy || i === targets.length - 1} aria-label="Move down">↓</button>
                {!t.is_primary && (
                  <>
                    <button type="button" className="rs-btn" onClick={() => toggleActive(t)} disabled={busy}>
                      {t.active ? "Pause" : "Resume"}
                    </button>
                    <button type="button" className="rs-btn" onClick={() => makeMain(t)} disabled={busy}>Make main</button>
                    <button type="button" className="rs-btn" onClick={() => remove(t)} disabled={busy}>Remove</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
