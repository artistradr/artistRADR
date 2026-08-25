import { useState } from "react";
import { Link } from "react-router-dom";
import { SPOTIFY_PLAYLISTS } from "../../../data/spotifyFollows";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Purely decorative — keyed by playlist key so it degrades gracefully
// (falls back to 🎧) if a new playlist is added to spotifyFollows.js
// without updating this map.
const PLAYLIST_ICONS = {
  spotify_new_music: "🎵",
  spotify_discoveries: "🌱",
  spotify_spotlight: "✨",
};

function EditorialPlaylists() {
  const [hovered, setHovered] = useState(null);

  return (
    <div id="channels">
      <div className="promo-section-label">Editorial Curation</div>
      <h2 className="promo-section-title">
        RADR's Curated <span style={{ fontStyle: "italic", color: "#D94F2B" }}>Playlists</span>
      </h2>
      <p className="promo-section-sub">
        Our editorial team hand-picks the best emerging talent for our
        signature playlists. Get featured alongside artists breaking through.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginTop: "24px"
      }}>
        {SPOTIFY_PLAYLISTS.map((playlist, index) => (
          <a
            key={playlist.key}
            href={playlist.url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "32px 28px",
              border: "0.5px solid rgba(0,0,0,0.06)",
              boxShadow: hovered === index ? "0 12px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.04)",
              transition: "all 300ms ease",
              transform: hovered === index ? "translateY(-4px)" : "translateY(0)",
              position: "relative",
              overflow: "hidden",
              textDecoration: "none",
              display: "block"
            }}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(217,79,43,0.06) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />

            <div style={{ fontSize: "32px", marginBottom: "12px" }}>
              {PLAYLIST_ICONS[playlist.key] ?? "🎧"}
            </div>
            <div style={{ fontFamily: F.d, fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: "6px" }}>
              {playlist.label}
            </div>
            <div style={{ fontSize: "14px", color: "#888", fontWeight: 300, lineHeight: 1.6, marginBottom: "20px" }}>
              {playlist.sub}
            </div>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#D94F2B",
              padding: "6px 14px",
              borderRadius: "100px",
              background: "rgba(217,79,43,0.06)",
              border: "0.5px solid rgba(217,79,43,0.15)"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D94F2B", display: "inline-block" }} />
              Open for Submissions
            </div>
          </a>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "36px" }}>
        <Link to="/submit-track" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(217,79,43,0.06)",
          color: "#D94F2B",
          padding: "12px 24px",
          borderRadius: "12px",
          fontSize: "13.5px",
          fontWeight: 600,
          textDecoration: "none",
          border: "0.5px solid rgba(217,79,43,0.2)"
        }}>
          Submit to Playlists
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    </div>
  );
}

export default EditorialPlaylists;