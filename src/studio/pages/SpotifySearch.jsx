// src/studio/pages/SpotifySearch.jsx
//
// Spotify track search used by the draft editor and by Discovery.
// Shows each track's release date, can limit results to a release period,
// and can sort newest first.
//
// The release period is applied twice: Spotify is asked for that year range
// (the studio-spotify function adds a year filter to the search), and results
// are then checked against the exact dates here. Spotify returns at most 10
// results per search in Development Mode, so a narrow period can show few.

import { useState } from "react";

// supabase-js hides the JSON body of non-2xx function responses in error.context
async function functionError(error) {
  try {
    const body = await error.context.json();
    return body.error || error.message;
  } catch {
    return error.message;
  }
}

const DAY = 86400000;

// Spotify release dates come as "2025", "2025-11" or "2025-11-07".
// Returns the first and last moment of that period (UTC), or null.
function period(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split("-").map(Number);
  if (!y) return null;
  if (m && d) {
    return { start: new Date(Date.UTC(y, m - 1, d)), end: new Date(Date.UTC(y, m - 1, d, 23, 59, 59)) };
  }
  if (m) {
    return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 0, 23, 59, 59)) };
  }
  return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y, 11, 31, 23, 59, 59)) };
}

export function formatRelease(str) {
  const p = period(str);
  if (!p) return "";
  const parts = String(str).split("-").length;
  const opts =
    parts === 3
      ? { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }
      : parts === 2
        ? { year: "numeric", month: "short", timeZone: "UTC" }
        : { year: "numeric", timeZone: "UTC" };
  return p.start.toLocaleDateString(undefined, opts);
}

const FILTERS = [
  { key: "any", label: "Any release date" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "365", label: "Last 12 months" },
  { key: "this_year", label: "This year" },
  { key: "last_year", label: "Last year" },
];

// The release window for a filter, plus the year range to ask Spotify for.
function windowFor(key, now = new Date()) {
  if (key === "any") return null;
  const y = now.getUTCFullYear();
  if (key === "this_year") {
    return { from: new Date(Date.UTC(y, 0, 1)), to: null, yearFrom: y, yearTo: y };
  }
  if (key === "last_year") {
    return {
      from: new Date(Date.UTC(y - 1, 0, 1)),
      to: new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59)),
      yearFrom: y - 1,
      yearTo: y - 1,
    };
  }
  const from = new Date(now.getTime() - Number(key) * DAY);
  return { from, to: null, yearFrom: from.getUTCFullYear(), yearTo: y };
}

function inWindow(track, win) {
  const p = period(track.release_date);
  if (!p) return false; // unknown date can't be shown as inside a period
  if (win.from && p.end < win.from) return false;
  if (win.to && p.start > win.to) return false;
  return true;
}

export default function SpotifySearch({
  supabase,
  initialQuery = "",
  pickLabel = "Add",
  onPick,
  busyKey = null,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("any");
  const [newestFirst, setNewestFirst] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const search = async (filterKey) => {
    setError("");
    setSearching(true);
    const win = windowFor(filterKey);
    const body = { action: "search", query };
    if (win) {
      body.year_from = win.yearFrom;
      body.year_to = win.yearTo;
    }
    const { data, error: fnErr } = await supabase.functions.invoke("studio-spotify", { body });
    if (fnErr) {
      setError(await functionError(fnErr));
      setResults([]);
    } else {
      setResults(data.tracks ?? []);
    }
    setSearched(true);
    setSearching(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    search(filter);
  };

  const onFilterChange = (e) => {
    const next = e.target.value;
    setFilter(next);
    // Ask Spotify again so the year range matches, if a search was already run.
    if (searched && query.trim().length >= 2) search(next);
  };

  const win = windowFor(filter);
  // If the search function isn't sending release dates yet (older version),
  // don't hide everything: show all results and say why the filter is off.
  const hasDates = results.some((t) => t.release_date);
  const filtering = !!win && hasDates;
  let shown = filtering ? results.filter((t) => inWindow(t, win)) : results;
  if (newestFirst) {
    shown = [...shown].sort((a, b) => {
      const pa = period(a.release_date)?.start.getTime() ?? -Infinity;
      const pb = period(b.release_date)?.start.getTime() ?? -Infinity;
      return pb - pa;
    });
  }

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
          {searching ? "Searching…" : "Search Spotify"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <select
          value={filter}
          onChange={onFilterChange}
          style={{ padding: "6px 8px" }}
          aria-label="Release date filter"
        >
          {FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={newestFirst} onChange={(e) => setNewestFirst(e.target.checked)} />
          Newest first
        </label>
      </div>

      {error && <div className="rs-alert error">{error}</div>}

      {searched && !searching && !error && (
        <>
          {filtering && (
            <p style={{ margin: "0 0 4px", opacity: 0.7 }}>
              {shown.length} of {results.length} results released in this period.
            </p>
          )}
          {!!win && results.length > 0 && !hasDates && (
            <p style={{ margin: "0 0 4px", opacity: 0.7 }}>
              Release dates are not available yet, so the date filter is off. The search function needs
              updating.
            </p>
          )}
          {shown.length === 0 && (
            <p>
              {results.length === 0
                ? "No results."
                : "No results in that period. Spotify returns at most 10 results per search, so try another keyword or a wider period."}
            </p>
          )}
        </>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {shown.map((t) => (
          <li key={t.spotify_id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0" }}>
            {t.image && <img src={t.image} alt="" width={40} height={40} />}
            <span style={{ flex: 1 }}>
              <strong>{t.name}</strong>
              <br />
              <small>
                {t.artists.join(", ")}
                {t.album ? ` · ${t.album}` : ""}
                {t.release_date ? ` · Released ${formatRelease(t.release_date)}` : ""}
              </small>
            </span>
            <button
              type="button"
              className="rs-btn"
              onClick={() => onPick(t)}
              disabled={busyKey === t.spotify_id}
            >
              {busyKey === t.spotify_id ? "Working…" : pickLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
