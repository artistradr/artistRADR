// src/studio/pages/ActivityLog.jsx
//
// Read-only list of Studio activity: Spotify connections, write tests, syncs
// and refused or failed syncs. Reads public.activity_logs (staff-only by RLS).

import { useCallback, useEffect, useMemo, useState } from "react";

const LABELS = {
  "spotify.connected": "Spotify connected",
  "spotify.disconnected": "Spotify disconnected",
  "spotify.write_test": "Spotify write test",
  "playlist.synced": "Playlist synced",
  "playlist.sync_failed": "Sync refused or failed",
  "discovery.accepted": "Candidate added to draft",
};

const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString() : "");

const isProblem = (row) =>
  row.action === "playlist.sync_failed" ||
  (row.action === "spotify.write_test" && row.details?.writes_work === false);

function summary(row) {
  const d = row.details ?? {};
  switch (row.action) {
    case "playlist.synced":
      return `Added ${d.added ?? 0}, removed ${d.removed ?? 0}, reordered ${d.moved ?? 0}. ${
        d.final_count ?? "?"
      } tracks on the playlist now.`;
    case "playlist.sync_failed":
      return d.error || "No reason recorded.";
    case "discovery.accepted":
      return `${d.artist ?? "Unknown artist"} — ${d.title ?? "Untitled"}${
        d.already_in_draft ? " (already in the draft)" : ""
      }`;
    case "spotify.write_test":
      if (d.writes_work === true) return "Create, add and remove all worked.";
      if (d.writes_work === false) return "A write step failed. See the write test panel for details.";
      return "";
    default:
      return "";
  }
}

export default function ActivityLog({ supabase, playlists = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | syncs | problems

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("activity_logs")
      .select("id, action, entity_type, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (err) setError(err.message);
    else setRows(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const titleById = useMemo(() => new Map(playlists.map((p) => [p.id, p.title])), [playlists]);

  const visible = rows.filter((r) => {
    if (filter === "syncs") return r.action.startsWith("playlist.");
    if (filter === "problems") return isProblem(r);
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {[
          ["all", "All"],
          ["syncs", "Syncs"],
          ["problems", "Problems"],
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
        <span style={{ flex: 1 }} />
        <button type="button" className="rs-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <div className="rs-alert error">{error}</div>}

      {!loading && visible.length === 0 && !error && <p>Nothing to show.</p>}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {visible.map((r) => {
          const problem = isProblem(r);
          const playlistTitle = r.entity_type === "playlist" ? titleById.get(r.entity_id) : null;
          const text = summary(r);
          return (
            <li
              key={r.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid rgba(128,128,128,0.2)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <strong style={problem ? { color: "#c0392b" } : undefined}>
                  {LABELS[r.action] ?? r.action}
                </strong>
                {playlistTitle && <span className="rs-chip">{playlistTitle}</span>}
                <small style={{ opacity: 0.6, marginLeft: "auto" }}>{fmtTime(r.created_at)}</small>
              </div>
              {text && <div style={{ opacity: 0.8, marginTop: 2 }}>{text}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}