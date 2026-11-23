// src/studio/pages/PlaylistTracks.jsx
//
// Read-only track list for one RADR playlist.
// Usage inside PlaylistsPage.jsx (where you already have your supabase client):
//
//   import PlaylistTracks from "./PlaylistTracks";
//   ...
//   <PlaylistTracks supabase={supabase} playlistId={playlist.id} />
//
// `playlist.id` is the radr_playlists uuid, not the Spotify ID.

import { useCallback, useEffect, useState } from "react";

function fmt(ms) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PlaylistTracks({ supabase, playlistId }) {
  const [state, setState] = useState({ loading: true, tracks: [], error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "playlist_tracks", playlist_id: playlistId },
    });

    if (error) {
      // supabase-js hides the JSON body of non-2xx responses in error.context
      let message = error.message;
      try {
        const body = await error.context.json();
        message = body.error || message;
      } catch { /* keep default */ }
      setState({ loading: false, tracks: [], error: message });
      return;
    }
    setState({ loading: false, tracks: data.tracks ?? [], error: null });
  }, [supabase, playlistId]);

  useEffect(() => { load(); }, [load]);

  if (state.loading) return <p>Loading tracks…</p>;
  if (state.error) {
    return (
      <div>
        <p role="alert">Could not load tracks: {state.error}</p>
        <button onClick={load}>Try again</button>
      </div>
    );
  }
  if (!state.tracks.length) return <p>This playlist has no tracks.</p>;

  return (
    <div>
      <p>{state.tracks.length} tracks</p>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {state.tracks.map((t, i) => (
          <li
            key={`${t.spotify_id ?? t.uri ?? "local"}-${i}`}
            style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0" }}
          >
            <span style={{ width: 24, opacity: 0.6 }}>{i + 1}</span>
            {t.image && <img src={t.image} alt="" width={40} height={40} />}
            <span style={{ flex: 1 }}>
              <strong>{t.name}</strong>
              <br />
              <small>{t.artists.join(", ")}{t.album ? ` · ${t.album}` : ""}</small>
            </span>
            <small>{fmt(t.duration_ms)}</small>
          </li>
        ))}
      </ol>
      <button onClick={load}>Refresh</button>
    </div>
  );
}