// src/studio/pages/ActiveCampaigns.jsx
//
// Approved playlist submissions that are running as campaigns. Each has a countdown that
// starts the first time the song goes live in a RADR playlist. Staff can add the song to
// any playlist draft from here. When the time is up the submission is resolved.

import { useCallback, useEffect, useState } from "react";
import SpotifySearch from "./SpotifySearch";

const MIN = 60000;

function countdown(c, now) {
  if (!c.campaign_started_at) return { text: "Waiting to go live", tone: "wait" };
  const ms = new Date(c.campaign_ends_at) - now;
  if (ms <= 0) return { text: "Time is up", tone: "done" };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / MIN);
  return { text: d > 0 ? `${d}d ${h}h ${m}m left` : `${h}h ${m}m left`, tone: "live" };
}

const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");

export default function ActiveCampaigns({ supabase, playlists, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [openId, setOpenId] = useState(null); // campaign whose "add to playlist" area is open
  const [target, setTarget] = useState({}); // campaign id -> playlist id
  const [busy, setBusy] = useState(null);
  const [daysEdit, setDaysEdit] = useState({}); // campaign id -> days text

  const load = useCallback(async () => {
    setError("");
    // Finish any campaign whose time is up before listing.
    await supabase.rpc("studio_resolve_expired_campaigns");
    const { data, error: err } = await supabase
      .from("playlist_submissions")
      .select("id, payload, status, campaign_days, campaign_started_at, campaign_ends_at, track_id, submitted_at")
      .eq("status", "approved")
      .order("campaign_ends_at", { ascending: true, nullsFirst: false })
      .order("submitted_at", { ascending: true });
    if (err) setError(err.message);
    else setRows(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the countdown moving, and re-check for finished campaigns every few minutes.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), MIN);
    const refresh = setInterval(load, 5 * MIN);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [load]);

  const addToDraft = async (c, track) => {
    const playlistId = target[c.id];
    if (!playlistId) {
      setError("Pick a playlist first.");
      return;
    }
    setError("");
    setNotice("");
    setBusy(c.id);
    const { data, error: rpcErr } = await supabase.rpc("studio_add_submission_to_draft", {
      p_submission_id: c.id,
      p_playlist_id: playlistId,
      p_track: track ?? null,
    });
    setBusy(null);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    const pl = playlists.find((p) => p.id === playlistId);
    setNotice(
      data?.added
        ? `Added to the "${pl?.title}" draft. Open that playlist, review, approve and sync it. The countdown starts when it goes live.`
        : `Already in the "${pl?.title}" draft.`
    );
    setOpenId(null);
    await load();
    onChanged?.();
  };

  const saveDays = async (c) => {
    const n = Number(daysEdit[c.id]);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      setError("Campaign days must be a whole number from 1 to 365.");
      return;
    }
    setError("");
    const { error: upErr } = await supabase.from("playlist_submissions").update({ campaign_days: n }).eq("id", c.id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setDaysEdit((d) => {
      const { [c.id]: _gone, ...rest } = d;
      return rest;
    });
    await load();
  };

  return (
    <div className="rs-panel">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Active campaigns</h2>
        <span className="rs-chip live">{rows.length}</span>
      </div>
      <p style={{ margin: "6px 0 12px", opacity: 0.7 }}>
        Approved submissions. The countdown starts when the song first goes live in a RADR playlist. When it ends,
        the submission is resolved.
      </p>

      {error && <div className="rs-alert error">{error}</div>}
      {notice && <div className="rs-alert">{notice}</div>}
      {loading && <p>Loading…</p>}
      {!loading && rows.length === 0 && <p>No active campaigns. Approve a submission to start one.</p>}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map((c) => {
          const p = c.payload || {};
          const cd = countdown(c, now);
          const open = openId === c.id;
          const editing = daysEdit[c.id] !== undefined;
          return (
            <li key={c.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(128,128,128,0.2)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 200 }}>
                  <strong>{p.artistName}</strong> — {p.trackName}
                  <br />
                  <small style={{ opacity: 0.75 }}>
                    {c.campaign_days}-day campaign ·{" "}
                    {c.campaign_started_at ? `live since ${day(c.campaign_started_at)}, ends ${day(c.campaign_ends_at)}` : "not live yet"}
                    {p.spotifyLink && (
                      <>
                        {" · "}
                        <a href={p.spotifyLink} target="_blank" rel="noreferrer">Spotify</a>
                      </>
                    )}
                  </small>
                </span>
                <span
                  className={`rs-chip ${cd.tone === "live" ? "live" : cd.tone === "wait" ? "next" : ""}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {cd.text}
                </span>
                {editing ? (
                  <>
                    <input
                      type="number" min={1} max={365} style={{ width: 64, padding: "6px 8px" }}
                      value={daysEdit[c.id]}
                      onChange={(e) => setDaysEdit((d) => ({ ...d, [c.id]: e.target.value }))}
                    />
                    <button type="button" className="rs-btn primary" onClick={() => saveDays(c)}>Save days</button>
                    <button
                      type="button" className="rs-btn"
                      onClick={() => setDaysEdit((d) => { const { [c.id]: _gone, ...rest } = d; return rest; })}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="rs-btn" onClick={() => setDaysEdit((d) => ({ ...d, [c.id]: String(c.campaign_days ?? 14) }))}>
                    Change days
                  </button>
                )}
                <button type="button" className="rs-btn" onClick={() => setOpenId(open ? null : c.id)}>
                  {open ? "Close" : "Add to playlist"}
                </button>
              </div>

              {open && (
                <div style={{ marginTop: 10, paddingLeft: 8 }}>
                  <select
                    value={target[c.id] || ""}
                    onChange={(e) => setTarget((t) => ({ ...t, [c.id]: e.target.value }))}
                    style={{ padding: "6px 8px", marginBottom: 8 }}
                    aria-label="Playlist"
                  >
                    <option value="">Choose a playlist…</option>
                    {playlists
                      .filter((pl) => pl.platform === "spotify")
                      .map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.title}</option>
                      ))}
                  </select>

                  {c.track_id ? (
                    <div>
                      <button
                        type="button" className="rs-btn primary"
                        disabled={busy === c.id || !target[c.id]}
                        onClick={() => addToDraft(c, null)}
                      >
                        {busy === c.id ? "Adding…" : "Add to draft"}
                      </button>
                      <small style={{ marginLeft: 8, opacity: 0.7 }}>
                        Song already matched on Spotify. It goes into the draft only; nothing changes on Spotify until you approve and sync.
                      </small>
                    </div>
                  ) : (
                    <div>
                      <small style={{ display: "block", marginBottom: 6, opacity: 0.7 }}>
                        Find the song on Spotify and pick the right one. It goes into the draft only.
                      </small>
                      <SpotifySearch
                        supabase={supabase}
                        initialQuery={`${p.trackName || ""} ${p.artistName || ""}`.trim()}
                        pickLabel="Add to draft"
                        onPick={(t) => addToDraft(c, t)}
                        busyKey={busy === c.id ? "busy" : null}
                      />
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
