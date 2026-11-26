import PropTypes from "prop-types";
import { artistNames, duration, safeArtwork, spotifyUrl } from "../spotifyTrack";

function SelectedTrack({ track, onChange }) {
  const art = safeArtwork(track);
  const link = spotifyUrl(track);
  const facts = [track.album, track.release_date && `Released ${track.release_date}`, duration(track.duration_ms)];

  return (
    <div className="flow-selected">
      {art ? <img src={art} alt={`Artwork for ${track.name}`} /> : <span className="flow-art-empty" />}
      <div className="flow-result-text">
        <div className="flow-selected-name">{track.name}</div>
        <div className="flow-selected-artist">{artistNames(track)}</div>
        <div className="flow-option-hint">{facts.filter(Boolean).join(" · ")}</div>
        <div className="flow-selected-links">
          {link && <a href={link} target="_blank" rel="noopener noreferrer">Open on Spotify</a>}
          <button type="button" className="flow-link" onClick={onChange}>Change song</button>
        </div>
      </div>
    </div>
  );
}

SelectedTrack.propTypes = { track: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };

export default SelectedTrack;
