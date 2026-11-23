// src/studio/pages/PlaylistsPage.jsx
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  disconnectSpotify,
  hasClientId,
  isWrongLocalHost,
  startSpotifyConnect,
} from "../spotify";
import PlaylistTracks from "./PlaylistTracks";
import PlaylistDraft from "./PlaylistDraft";
import WriteTestPanel from "./WriteTestPanel";
import ActivityLog from "./ActivityLog";
import "./playlists.css";

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "Never");

export default function PlaylistsPage() {
  const [account, setAccount] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null); // playlist whose draft editor is open
  const [liveId, setLiveId] = useState(null); // playlist whose live Spotify tracks are showing
  const [showLog, setShowLog] = useState(false); // activity log panel

  const load = useCallback(async () => {
    setError("");
    const [acc, pl] = await Promise.all([
      supabase
        .from("connected_accounts")
        .select("id, display_name, provider_account_id, status, scopes, connected_at, last_error")
        .eq("provider", "spotify")
        .order("connected_at", { ascending: false })
        .limit(1),
      supabase
        .from("radr_playlists")
        .select("id, platform, title, description, url, sync_status, last_synced_at")
        .eq("is_archived", false)
        .order("title"),
    ]);

    if (acc.error || pl.error) {
      setError((acc.error || pl.error).message);
    } else {
      setAccount(acc.data?.[0] ?? null);
      setPlaylists(pl.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = () => {
    setError("");
    try {
      startSpotifyConnect();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Spotify from RADR Studio? Playlists on Spotify are not affected.")) return;
    setBusy(true);
    setError("");
    try {
      await disconnectSpotify();
      setOpenId(null);
      setLiveId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  // Opening a playlist shows the draft editor only. Live tracks stay hidden
  // until the "Show live tracks on Spotify" button is clicked.
  const toggleOpen = (id) => {
    setLiveId(null);
    setOpenId((cur) => (cur === id ? null : id));
  };
  const toggleLive = (id) => setLiveId((cur) => (cur === id ? null : id));

  // Spotify account is usable only when connected and healthy.
  const spotifyReady = account?.status === "active";

  return (
    <>
      <div className="rs-head">
        <h1 className="rs-h1">Playlists</h1>
        <span className="rs-chip next">Phase 2</span>
      </div>
      <p className="rs-sub">
        Your RADR playlists on Spotify. Connect the RADR Spotify account first, then build drafts
        and sync them after you approve the changes.
      </p>

      {isWrongLocalHost() && (
        <div className="rs-alert warn">
          Spotify only allows local sign-in on <code>127.0.0.1</code>. Open Studio at{" "}
          <code>http://127.0.0.1:5174/studio</code> (not localhost) before connecting.
        </div>
      )}
      {!hasClientId && (
        <div className="rs-alert warn">
          Add <code>VITE_STUDIO_SPOTIFY_CLIENT_ID</code> to <code>.env.studio</code> and restart{" "}
          <code>npm run dev:studio</code>.
        </div>
      )}
      {account && !spotifyReady && (
        <div className="rs-alert warn">
          The Spotify connection needs attention (status: {account.status}). Disconnect and connect again.
        </div>
      )}
      {error && <div className="rs-alert error">{error}</div>}

      <div className="rs-panel">
        <h2>Spotify connection</h2>
        {loading ? (
          <p>Loading…</p>
        ) : account ? (
          <div className="rs-conn">
            <div>
              <div className="rs-conn-name">{account.display_name || account.provider_account_id}</div>
              <div className="rs-conn-meta">
                Status: {account.status} · Connected {fmt(account.connected_at)}
              </div>
              {account.last_error && <div className="rs-conn-meta">Last error: {account.last_error}</div>}
            </div>
            <button type="button" className="rs-btn" onClick={handleDisconnect} disabled={busy}>
              {busy ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <div className="rs-conn">
            <div className="rs-conn-meta">Not connected. Sign in with the RADR Spotify account.</div>
            <button
              type="button"
              className="rs-btn primary"
              onClick={handleConnect}
              disabled={!hasClientId || isWrongLocalHost()}
            >
              Connect Spotify
            </button>
          </div>
        )}
      </div>

      {spotifyReady && <WriteTestPanel supabase={supabase} />}

      <div className="rs-panel">
        <h2>RADR playlists</h2>
        {loading ? (
          <p>Loading…</p>
        ) : playlists.length === 0 ? (
          <p>No playlists yet.</p>
        ) : (
          <div className="rs-pl-list">
            {playlists.map((p) => (
              <div key={p.id}>
                <div className="rs-pl">
                  <div>
                    <div className="rs-pl-title">{p.title}</div>
                    <div className="rs-pl-desc">
                      {p.description || "—"} · Last synced {fmt(p.last_synced_at)}
                    </div>
                  </div>
                  <div className="rs-pl-right">
                    <span className="rs-chip">{p.platform === "spotify" ? "Spotify" : "Apple Music"}</span>
                    <span className="rs-chip">{p.sync_status}</span>
                    {p.platform === "spotify" && (
                      <button
                        type="button"
                        className="rs-btn"
                        onClick={() => toggleOpen(p.id)}
                        disabled={!spotifyReady}
                        title={spotifyReady ? "" : "Connect Spotify first"}
                      >
                        {openId === p.id ? "Close" : "Open draft"}
                      </button>
                    )}
                    {p.url && (
                      <a className="rs-btn" href={p.url} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                </div>

                {openId === p.id && (
                  <div style={{ padding: "8px 16px 16px" }}>
                    <PlaylistDraft supabase={supabase} playlistId={p.id} />

                    <hr style={{ margin: "16px 0", opacity: 0.2 }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <h3 style={{ margin: 0, flex: 1 }}>Live playlist on Spotify</h3>
                      <button type="button" className="rs-btn" onClick={() => toggleLive(p.id)}>
                        {liveId === p.id ? "Hide live tracks" : "Show live tracks on Spotify"}
                      </button>
                    </div>

                    {liveId === p.id && (
                      <div style={{ maxHeight: 420, overflowY: "auto", marginTop: 8 }}>
                        <PlaylistTracks supabase={supabase} playlistId={p.id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rs-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, flex: 1 }}>Activity log</h2>
          <button type="button" className="rs-btn" onClick={() => setShowLog((v) => !v)}>
            {showLog ? "Hide activity" : "Show activity"}
          </button>
        </div>
        {showLog && (
          <div style={{ marginTop: 8, maxHeight: 460, overflowY: "auto" }}>
            <ActivityLog supabase={supabase} playlists={playlists} />
          </div>
        )}
      </div>
    </>
  );
}