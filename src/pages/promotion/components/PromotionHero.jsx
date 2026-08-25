import { SITE_STATS } from "../../../data/siteStats";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function PromotionHero() {
  // Was: hardcoded { "Artists Featured": "200+", "Playlist Placements": "50+",
  // "Success Rate": "87%" } — contradicted HomeStats.jsx's numbers (e.g.
  // "200+" meant something different on each page) and "Success Rate" had
  // no source at all. Now reuses the same site-wide figures as HomeStats.jsx
  // so the two pages can't disagree. See MIGRATION.md Section 25.
  const trustStats = [
    SITE_STATS.artistsDiscovered,
    SITE_STATS.curatedPlaylists,
    SITE_STATS.creatorRating,
  ];

  return (
    <section style={{ 
      padding: "60px 0 80px",
      background: "linear-gradient(170deg, #f7f6f3 0%, #fff 100%)",
      borderBottom: "0.5px solid rgba(0,0,0,0.06)"
    }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "60px", 
          alignItems: "center" 
        }}>
          {/* Left: Content */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#D94F2B",
              background: "rgba(217,79,43,0.08)",
              border: "0.5px solid rgba(217,79,43,0.2)",
              borderRadius: "100px",
              padding: "5px 16px",
              marginBottom: "18px"
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D94F2B" }} />
              Amplify Your Reach
            </div>

            <h1 style={{
              fontFamily: F.d,
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "2px",
              lineHeight: 1.05,
              color: "#111",
              marginBottom: "20px"
            }}>
              Get Your Music <br />
              <span style={{ fontStyle: "italic", color: "#D94F2B" }}>Discovered</span>
            </h1>

            <p style={{
              fontSize: "16px",
              color: "#666",
              fontWeight: 300,
              lineHeight: 1.8,
              maxWidth: "480px",
              marginBottom: "32px"
            }}>
              From Spotify playlists to YouTube Shorts, we help emerging artists 
              get their music in front of the right audiences. No gatekeepers, 
              just real opportunities.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <a href="/submit-track" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#D94F2B",
                color: "white",
                padding: "14px 28px",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(217,79,43,0.35)"
              }}>
                Submit Your Track
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a href="#channels" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0,0,0,0.05)",
                color: "#111",
                padding: "14px 28px",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 500,
                textDecoration: "none",
                border: "0.5px solid rgba(0,0,0,0.08)"
              }}>
                Explore Channels
              </a>
            </div>

            {/* Trust indicators */}
            <div style={{ 
              display: "flex", 
              gap: "32px", 
              marginTop: "40px", 
              paddingTop: "32px",
              borderTop: "0.5px solid rgba(0,0,0,0.06)"
            }}>
              {trustStats.map(({ value, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: F.d, fontSize: "1.4rem", fontWeight: 800, color: "#D94F2B" }}>{value}</div>
                  <div style={{ fontSize: "11px", color: "#aaa", fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual / Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            padding: "20px"
          }}>
            {[
              { icon: "🎧", label: "Spotify", desc: "Curated playlist placements", color: "#1DB954" },
              { icon: "🍎", label: "Apple Music", desc: "Editorial pitching", color: "#FA243C" },
              { icon: "▶️", label: "YouTube", desc: "Shorts & UGC campaigns", color: "#FF0000" },
              { icon: "📱", label: "TikTok", desc: "Sound promotion", color: "#000000" }
            ].map(({ icon, label, desc, color }) => (
              <div key={label} style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px 20px",
                border: "0.5px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: "transform 200ms ease, box-shadow 200ms ease",
                cursor: "default"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
                <div style={{ fontFamily: F.d, fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "12px", color: "#888", fontWeight: 300 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .promotion-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .promotion-hero-stats {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default PromotionHero;