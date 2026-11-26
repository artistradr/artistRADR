import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { artistNames, safeArtwork, searchTracks } from "../spotifyTrack";
import SelectedTrack from "./SelectedTrack";

const NO_RESULT = { query: "", tracks: [], failed: false };

// Type a song name or paste a Spotify link, then pick the track.
function TrackSearch({ draft, update }) {
  const [result, setResult] = useState(NO_RESULT);
  const query = draft.name.trim();
  const active = !draft.track && query.length >= 2;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    // Wait for a pause in typing, and ignore answers to older searches.
    const timer = setTimeout(() => {
      searchTracks(query)
        .then((tracks) => !cancelled && setResult({ query, tracks, failed: false }))
        .catch(() => !cancelled && setResult({ query, tracks: [], failed: true }));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, active]);

  if (draft.track) {
    return <SelectedTrack track={draft.track} onChange={() => update({ track: null, name: "", releaseDate: "" })} />;
  }

  const current = result.query === query;
  let message = "";
  if (active && !current) message = "Searching Spotify…";
  else if (active && result.failed) message = "Spotify search isn't available right now. You can continue with the song name.";
  else if (active && !result.tracks.length) message = "No match on Spotify. Check the spelling or paste the track link.";

  return (
    <>
      <label className="flow-label" htmlFor="flow-track">Song</label>
      <input
        id="flow-track"
        className="flow-input"
        type="search"
        autoComplete="off"
        placeholder="Search a song name or paste a Spotify link"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        autoFocus
      />
      <div className="flow-note" aria-live="polite">
        {message || "Not on Spotify yet? Type the song name and continue."}
      </div>

      {active && current && result.tracks.length > 0 && (
        <>
          <ul className="flow-results">
            {result.tracks.map((track) => (
              <li key={track.spotify_id}>
                <button type="button" onClick={() => update({ track, name: track.name })}>
                  {safeArtwork(track) ? <img src={safeArtwork(track)} alt="" /> : <span className="flow-art-empty" />}
                  <span className="flow-result-text">
                    <span className="flow-option-name">{track.name}</span>
                    <span className="flow-option-hint">
                      {artistNames(track)}
                      {track.release_date && ` · ${track.release_date.slice(0, 4)}`}
                    </span>
                  </span>
                  <span className="flow-result-pick">Select</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flow-note">Results from Spotify</div>
        </>
      )}
    </>
  );
}

TrackSearch.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default TrackSearch;
