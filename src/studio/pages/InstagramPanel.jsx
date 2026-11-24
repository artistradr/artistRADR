// src/studio/pages/InstagramPanel.jsx
//
// Discovery > Instagram: connect the RADR Instagram login, keep a watchlist of
// Business/Creator accounts, and take snapshots of their public numbers.
//
// Instagram gives point-in-time counts only. "Growth" is calculated from our own
// snapshots, so it shows only once an account has at least two of them, and always
// with the dates it was measured between.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  callInstagram,
  disconnectInstagram,
  hasMetaAppId,
  instagramStatus,
  startInstagramConnect,
} from "../instagram";
import "./playlists.css";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "never");
const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString() : "–");

// Same maths as the Edge Function: average over posts that show a count.
function summarise(snapshot) {
  const posts = snapshot?.posts ?? [];
  const likes = posts.filter((p) => typeof p.like_count === "number");
  const comments = posts.filter((p) => typeof p.comments_count === "number");
  const avgLikes = likes.length ? likes.reduce((n, p) => n + p.like_count, 0) / likes.length : null;
  const avgComments = comments.length
    ? comments.reduce((n, p) => n + p.comments_count, 0) / comments.length
    : null;
  const followers = snapshot?.followers_count;
  const engagement =
    followers > 0 && avgLikes !== null ? ((avgLikes + (avgComments ?? 0)) / followers) * 100 : null;
  return { avgLikes, avgComments, engagement, postCount: posts.length };
}

const round1 = (n) => (n === null ? "–" : (Math.round(n * 10) / 10).toLocaleString());

function AccountRow({ a, latest, previous, busy, onRefresh, onRemove }) {
  const [showPosts, setShowPosts] = useState(false);
  const s = summarise(latest);
  const posts = latest?.posts ?? [];

  const growth =
    latest && previous && typeof latest.followers_count === "number" && typeof previous.followers_count === "number"
      ? latest.followers_count - previous.followers_count
      : null;

  return (
    <li style={{ padding: "10px 0", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ flex: 1, minWidth: 200 }}>
          <strong>@{a.username}</strong>
          {a.display_name ? ` · ${a.display_name}` : ""}
          <br />
          <small>
            {fmtNum(a.followers_count)} followers · {fmtNum(a.media_count)} posts · checked {fmtDate(a.last_checked_at)}
          </small>
        </span>
        <span className="rs-chip">Avg likes {round1(s.avgLikes)}</span>
        <span className="rs-chip">Avg comments {round1(s.avgComments)}</span>
        <span className="rs-chip">
          Engagement {s.engagement === null ? "–" : `${Math.round(s.engagement * 100) / 100}%`}
        </span>
        {a.last_error && <span className="rs-chip">{a.last_error}</span>}
      </div>

      <div style={{ margin: "4px 0 0", opacity: 0.75 }}>
        <small>
          {growth === null
            ? "Growth: needs at least two snapshots."
            : `Followers ${growth >= 0 ? "+" : ""}${growth.toLocaleString()} between ${fmtDate(previous.observed_at)} and ${fmtDate(latest.observed_at)} (our own snapshots).`}
          {s.postCount > 0 && ` Based on the latest ${s.postCount} posts.`}
        </small>
        {a.notes && <div>{a.notes}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <a className="rs-btn" href={`https://www.instagram.com/${a.username}/`} target="_blank" rel="noopener noreferrer">
          Open on Instagram
        </a>
        <button type="button" className="rs-btn" onClick={() => setShowPosts((v) => !v)} disabled={!posts.length}>
          {showPosts ? "Hide posts" : "Recent posts"}
        </button>
        <button type="button" className="rs-btn" onClick={() => onRefresh(a)} disabled={busy}>
          Refresh
        </button>
        <button type="button" className="rs-btn" onClick={() => onRemove(a)} disabled={busy}>
          Remove
        </button>
      </div>

      {showPosts && (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
          {posts.map((p) => (
            <li key={p.id || p.permalink} style={{ padding: "4px 0" }}>
              <small>
                {fmtDate(p.timestamp)} · {p.media_type ?? "post"} · {typeof p.like_count === "number" ? `${fmtNum(p.like_count)} likes` : "likes hidden"} ·{" "}
                {fmtNum(p.comments_count)} comments ·{" "}
                {p.permalink && (
                  <a href={p.permalink} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                )}
              </small>
              {p.caption && (
                <div style={{ opacity: 0.75 }}>
                  <small>{p.caption.length > 140 ? `${p.caption.slice(0, 140)}…` : p.caption}</small>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function InstagramPanel() {
  const [conn, setConn] = useState(null); // { connected, display_name, status, last_error }
  const [accounts, setAccounts] = useState([]);
  const [snaps, setSnaps] = useState(new Map()); // account_id -> [latest, previous]
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null); // account id, "all", "add" or "connect"
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [status, acc, sn] = await Promise.all([
        instagramStatus(),
        supabase
          .from("discovery_ig_accounts")
          .select("id, username, display_name, followers_count, media_count, is_active, notes, last_checked_at, last_error")
          .order("username"),
        supabase
          .from("discovery_ig_snapshots")
          .select("account_id, observed_at, followers_count, media_count, posts")
          .order("observed_at", { ascending: false })
          .limit(1000),
      ]);
      if (acc.error) throw acc.error;
      if (sn.error) throw sn.error;

      const byAccount = new Map();
      for (const row of sn.data ?? []) {
        const list = byAccount.get(row.account_id) ?? [];
        if (list.length < 2) list.push(row);
        byAccount.set(row.account_id, list);
      }
      setConn(status);
      setAccounts(acc.data ?? []);
      setSnaps(byAccount);
    } catch (e) {
      setError(e.message || "Could not load Instagram data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connected = conn?.connected === true;

  const run = async (key, fn) => {
    setBusyId(key);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message || "Something went wrong");
      if (e.payload?.needs_reconnect) load();
    }
    setBusyId(null);
  };

  const handleConnect = () => {
    setError("");
    try {
      startInstagramConnect();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisconnect = () => {
    if (!window.confirm("Disconnect Instagram from RADR Studio? Your watchlist and past snapshots are kept.")) return;
    run("connect", async () => {
      await disconnectInstagram();
      await load();
    });
  };

  const handlePreview = (e) => {
    e.preventDefault();
    setPreview(null);
    run("add", async () => {
      const r = await callInstagram({ action: "lookup", username });
      setPreview(r.profile);
    });
  };

  const handleAdd = () => {
    run("add", async () => {
      const r = await callInstagram({ action: "add_account", username, notes });
      setNotice(`Added @${r.profile.username} to the watchlist.`);
      setUsername("");
      setNotes("");
      setPreview(null);
      await load();
    });
  };

  const handleRefresh = (a) =>
    run(a.id, async () => {
      const r = await callInstagram({ action: "snapshot", account_id: a.id });
      if (r.failed) throw new Error(r.results?.[0]?.error || "Could not refresh this account");
      setNotice(`Refreshed @${a.username}.`);
      await load();
    });

  const handleRefreshAll = () =>
    run("all", async () => {
      const r = await callInstagram({ action: "snapshot" });
      setNotice(`Refreshed ${r.ok} account(s)${r.failed ? `, ${r.failed} failed` : ""}.`);
      await load();
    });

  const handleRemove = (a) => {
    if (!window.confirm(`Remove @${a.username} and its saved snapshots from the watchlist?`)) return;
    run(a.id, async () => {
      await callInstagram({ action: "remove_account", account_id: a.id });
      await load();
    });
  };

  const sorted = useMemo(
    () => [...accounts].sort((x, y) => (y.followers_count ?? 0) - (x.followers_count ?? 0)),
    [accounts]
  );

  return (
    <div className="rs-panel">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Instagram</h2>
        <span className="rs-chip">{connected ? `Connected ${conn.display_name ?? ""}` : "Not connected"}</span>
        <button type="button" className="rs-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Open"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 8 }}>
          <p className="rs-sub" style={{ marginTop: 0 }}>
            Reads public numbers of Business and Creator accounts through Instagram's official API. Counts are
            point-in-time; growth is worked out from our own snapshots. Nothing is posted or changed on Instagram.
          </p>

          {!hasMetaAppId && (
            <div className="rs-alert warn">
              Add <code>VITE_STUDIO_META_APP_ID</code> to <code>.env.studio</code> and restart{" "}
              <code>npm run dev:studio</code> (or rebuild) before connecting.
            </div>
          )}
          {conn && !connected && conn.status === "error" && (
            <div className="rs-alert warn">
              The Instagram connection needs attention{conn.last_error ? `: ${conn.last_error}` : ""}. Connect again.
            </div>
          )}
          {error && <div className="rs-alert error">{error}</div>}
          {notice && <div className="rs-alert">{notice}</div>}

          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {connected ? (
                  <button type="button" className="rs-btn" onClick={handleDisconnect} disabled={busyId === "connect"}>
                    Disconnect Instagram
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rs-btn primary"
                    onClick={handleConnect}
                    disabled={!hasMetaAppId || busyId === "connect"}
                  >
                    Connect Instagram
                  </button>
                )}
                {connected && sorted.length > 0 && (
                  <button type="button" className="rs-btn" onClick={handleRefreshAll} disabled={busyId === "all"}>
                    {busyId === "all" ? "Refreshing…" : "Refresh all"}
                  </button>
                )}
              </div>

              {connected && (
                <form onSubmit={handlePreview} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setPreview(null);
                    }}
                    placeholder="Instagram username, e.g. audiomack"
                    required
                    maxLength={31}
                    style={{ flex: 1, minWidth: 200, padding: "6px 8px" }}
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note (optional)"
                    maxLength={300}
                    style={{ flex: 1, minWidth: 160, padding: "6px 8px" }}
                  />
                  <button type="submit" className="rs-btn" disabled={busyId === "add" || !username.trim()}>
                    {busyId === "add" ? "Checking…" : "Check account"}
                  </button>
                </form>
              )}

              {preview && (
                <div className="rs-alert" style={{ marginBottom: 12 }}>
                  <strong>@{preview.username}</strong>
                  {preview.name ? ` · ${preview.name}` : ""}: {fmtNum(preview.followers_count)} followers,{" "}
                  {fmtNum(preview.media_count)} posts. Latest {preview.posts.length} posts average{" "}
                  {round1(preview.avg_likes)} likes and {round1(preview.avg_comments)} comments
                  {preview.engagement_pct !== null ? ` (${preview.engagement_pct}% of followers)` : ""}.
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="rs-btn primary" onClick={handleAdd} disabled={busyId === "add"}>
                      Add to watchlist
                    </button>
                  </div>
                </div>
              )}

              {sorted.length === 0 ? (
                <p>{connected ? "No accounts on the watchlist yet." : "Connect Instagram to start a watchlist."}</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sorted.map((a) => (
                    <AccountRow
                      key={a.id}
                      a={a}
                      latest={snaps.get(a.id)?.[0]}
                      previous={snaps.get(a.id)?.[1]}
                      busy={busyId === a.id || busyId === "all"}
                      onRefresh={handleRefresh}
                      onRemove={handleRemove}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
