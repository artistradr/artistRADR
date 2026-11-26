import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { artistNames, safeArtwork, searchTracks } from "../spotifyTrack";
import SelectedTrack from "./SelectedTrack";

const NO_RESULT = { query: "", tracks: [], failed: false };

// Optional second song on Supercharge. RADR picks its playlists.
function ExtraTrackField({ draft, update }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(NO_RESULT);
  const text = query.trim();
  const active = !draft.extraTrack && text.length >= 2;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchTracks(text)
        .then((tracks) => !cancelled && setResult({ query: text, tracks, failed: false }))
        .catch(() => !cancelled && setResult({ query: text, tracks: [], failed: true }));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, active]);

  if (draft.extraTrack) {
    return (
      <div className="flow-extra">
        <div className="flow-label">Second song</div>
        <SelectedTrack track={draft.extraTrack} onChange={() => { update({ extraTrack: null }); setQuery(""); }} />
      </div>
    );
  }

  const current = result.query === text;
  const mainId = draft.track?.spotify_id;
  const tracks = result.tracks.filter((t) => t.spotify_id !== mainId);
  let message = "";
  if (active && !current) message = "Searching Spotify…";
  else if (active && result.failed) message = "Spotify search isn't available right now. Try again in a moment.";
  else if (active && !tracks.length) message = "No match on Spotify. Check the spelling or paste the track link.";

  return (
    <div className="flow-extra">
      <label className="flow-label" htmlFor="flow-extra-track">Add a second song (optional)</label>
      <input
        id="flow-extra-track"
        className="flow-input"
        type="search"
        autoComplete="off"
        placeholder="Search a song name or paste a Spotify link"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      />
      <div className="flow-note" aria-live="polite">
        {message || "Supercharge covers one extra song in the same campaign. RADR picks its playlists."}
      </div>

      {active && current && tracks.length > 0 && (
        <ul className="flow-results">
          {tracks.map((track) => (
            <li key={track.spotify_id}>
              <button type="button" onClick={() => { update({ extraTrack: track }); setQuery(""); }}>
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
      )}
    </div>
  );
}

ExtraTrackField.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default ExtraTrackField;
