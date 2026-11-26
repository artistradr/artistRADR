// src/studio/components/CampaignPlaylists.jsx
//
// Staff attach the playlists that carry a campaign's track. The artist sees each cover,
// with a link, on their campaign preview. Paste a Spotify playlist link, check what comes
// back, then attach it. The lookup runs in the campaign-playlist-lookup Edge Function.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./campaignPlaylists.css";

const ID_RE = /^[A-Za-z0-9]{22}$/;

async function lookupPlaylist(url, trackId) {
  const { data, error } = await supabase.functions.invoke("campaign-playlist-lookup", {
    body: { url, track_id: trackId },
  });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context.json();
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  return data;
}

function Cover({ url }) {
  if (!url) return <div className="cpl-cover cpl-cover-empty" />;
  return <img className="cpl-cover" src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />;
}

// What the track check found, in words.
function trackCheck(found, hasTrack) {
  if (!hasTrack) return { tone: "", text: "No Spotify track was picked, so the track check was skipped." };
  if (found.has_track === true) return { tone: "ok", text: "The artist's track is in this playlist." };
  if (found.has_track === false) return { tone: "warn", text: "The artist's track was not found in this playlist." };
  return { tone: "", text: "Could not check whether the track is in this playlist." };
}

export default function CampaignPlaylists({ campaign }) {
  const track = campaign.spotify_track;
  const trackId = ID_RE.test(track?.spotify_id ?? "") ? track.spotify_id : null;
  const artists = Array.isArray(track?.artists) ? track.artists.join(", ") : "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState("");
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("campaign_playlists")
      .select("id, spotify_playlist_id, title, image_url")
      .eq("campaign_id", campaign.id)
      .order("created_at");
    if (err) setError(err.message);
    else setRows(data ?? []);
    setLoading(false);
  }, [campaign.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function find(e) {
    e.preventDefault();
    const text = link.trim();
    if (!text) return;
    setError("");
    setFound(null);
    setBusy("find");
    try {
      setFound(await lookupPlaylist(text, trackId));
    } catch (err) {
      setError(err.message);
    }
    setBusy("");
  }

  async function attach() {
    const p = found.playlist;
    setError("");
    setBusy("attach");
    const { error: err } = await supabase.from("campaign_playlists").insert({
      campaign_id: campaign.id,
      spotify_playlist_id: p.spotify_playlist_id,
      title: p.title,
      image_url: p.image_url,
    });
    setBusy("");
    if (err) {
      setError(err.code === "23505" ? "That playlist is already attached to this campaign." : err.message);
      return;
    }
    setFound(null);
    setLink("");
    await load();
  }

  async function remove(row) {
    setError("");
    setBusy(row.id);
    const { error: err } = await supabase.from("campaign_playlists").delete().eq("id", row.id);
    setBusy("");
    if (err) setError(err.message);
    else await load();
  }

  const check = found ? trackCheck(found, Boolean(trackId)) : null;

  return (
    <section className="cpl">
      <div className="cpl-head">
        <h3 className="cpl-title">Playlists for the artist</h3>
        <span className="cpl-sub">Shown on the artist's campaign preview, with a link to each.</span>
      </div>

      <p className="cpl-track">
        {trackId ? (
          <>
            Find playlists that include{" "}
            <a href={`https://open.spotify.com/track/${trackId}`} target="_blank" rel="noopener noreferrer">
              {track.name}
            </a>
            {artists && ` by ${artists}`}.
          </>
        ) : (
          "No Spotify track was picked for this campaign, so the track check is skipped."
        )}
      </p>

      {loading ? (
        <div className="cpl-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="cpl-empty">Nothing attached yet.</div>
      ) : (
        <div className="cpl-list">
          {rows.map((r) => (
            <div key={r.id} className="cpl-item">
              <Cover url={r.image_url} />
              <a
                className="cpl-name"
                href={`https://open.spotify.com/playlist/${r.spotify_playlist_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {r.title || "Spotify playlist"}
              </a>
              <button type="button" className="rs-btn danger" disabled={busy === r.id} onClick={() => remove(r)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="cpl-form" onSubmit={find}>
        <input
          className="rc-input"
          type="text"
          placeholder="Paste a Spotify playlist link"
          value={link}
          maxLength={300}
          onChange={(e) => setLink(e.target.value)}
          aria-label="Spotify playlist link"
        />
        <button type="submit" className="rs-btn" disabled={busy === "find" || !link.trim()}>
          {busy === "find" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {found && (
        <div className="cpl-found">
          <Cover url={found.playlist.image_url} />
          <div className="cpl-found-main">
            <div className="cpl-found-title">{found.playlist.title || "Spotify playlist"}</div>
            <div className={`cpl-check${check.tone ? ` ${check.tone}` : ""}`}>{check.text}</div>
          </div>
          <button type="button" className="rs-btn primary" disabled={busy === "attach"} onClick={attach}>
            {busy === "attach" ? "Attaching…" : "Attach to campaign"}
          </button>
          <button type="button" className="rs-btn" onClick={() => setFound(null)}>Clear</button>
        </div>
      )}

      {error && <div className="rs-alert error" style={{ marginTop: 12 }}>{error}</div>}
    </section>
  );
}
