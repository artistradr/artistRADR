// src/studio/pages/WriteTestPanel.jsx
//
// One-click check of which Spotify playlist writes work in Development Mode.
// Creates a brand-new PRIVATE throwaway playlist, adds a track, reads it back,
// removes it, then tries to remove the playlist. Never touches the RADR playlists.

import { useState } from "react";

async function functionError(error) {
  try {
    const body = await error.context.json();
    return body.error || error.message;
  } catch {
    return error.message;
  }
}

export default function WriteTestPanel({ supabase }) {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (
      !window.confirm(
        "This creates a private test playlist on the connected Spotify account, adds and removes one track, " +
          "then tries to delete it. Your RADR playlists are not touched. Continue?",
      )
    ) {
      return;
    }
    setRunning(true);
    setError("");
    setReport(null);
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "write_test" },
    });
    if (fnErr) setError(await functionError(fnErr));
    else setReport(data);
    setRunning(false);
  };

  return (
    <div className="rs-panel">
      <h2>Spotify write test</h2>
      <p>
        Checks whether Spotify lets Studio create playlists, add and remove tracks in Development Mode.
        Uses a throwaway private playlist.
      </p>
      <button type="button" className="rs-btn" onClick={run} disabled={running}>
        {running ? "Running test…" : "Run write test"}
      </button>

      {error && <div className="rs-alert error" style={{ marginTop: 8 }}>{error}</div>}

      {report && (
        <div style={{ marginTop: 12 }}>
          <p>
            <strong>
              {report.writes_work
                ? "Playlist writes work."
                : "Playlist writes did NOT fully work. See the steps below."}
            </strong>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {report.steps.map((s, i) => (
              <li key={i} style={{ padding: "2px 0" }}>
                {s.ok ? "✅" : "❌"} {s.step}
                {s.status ? ` (${s.status})` : ""}
                {s.note ? ` — ${s.note}` : ""}
              </li>
            ))}
          </ul>
          {report.playlist_url && (
            <p style={{ marginTop: 8 }}>
              Test playlist:{" "}
              <a href={report.playlist_url} target="_blank" rel="noopener noreferrer">
                open in Spotify
              </a>{" "}
              (delete it if the cleanup step failed).
            </p>
          )}
        </div>
      )}
    </div>
  );
}