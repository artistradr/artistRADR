// Playlist covers staff attached to a campaign. Each one links out to Spotify.
const EMPTY_TEXT = {
  pending: "Playlists appear here once your campaign is approved and we've matched your track.",
  completed: "No playlists were attached to this campaign.",
};
const DEFAULT_EMPTY = "We're lining up playlists for your track. They'll show up here as soon as they're added.";

const NOTE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

function PlaylistCovers({ playlists = [], status }) {
  const count = playlists.length;

  return (
    <section className="campaign-playlists" aria-label="Playlists">
      <div className="campaign-playlists-head">
        <h2 className="campaign-playlists-title">Playlists</h2>
        {count > 0 && (
          <span className="campaign-playlists-count">
            {count} {count === 1 ? "playlist" : "playlists"}
          </span>
        )}
      </div>

      {count === 0 ? (
        <div className="campaign-playlists-empty">{EMPTY_TEXT[status] ?? DEFAULT_EMPTY}</div>
      ) : (
        <div className="campaign-playlist-grid">
          {playlists.map((p) => (
            <a key={p.id} className="campaign-playlist-card" href={p.url} target="_blank" rel="noopener noreferrer">
              {p.image ? (
                <img className="campaign-playlist-cover" src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="campaign-playlist-cover campaign-playlist-cover--empty">{NOTE_ICON}</div>
              )}
              <div className="campaign-playlist-text">
                <div className="campaign-playlist-name">{p.title || "Spotify playlist"}</div>
                <div className="campaign-playlist-open">Open on Spotify ↗</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default PlaylistCovers;
