const F = { d: "var(--font-display)", b: "var(--font-body)" };

const PLATFORMS = [
  {
    id: "spotify",
    name: "Spotify",
    icon: "🎧",
    color: "#1DB954",
    benefits: [
      "Curated playlist placements",
      "Algorithmic discovery optimization",
      "Artist profile optimization",
      "Pitching to editorial playlists"
    ]
  },
  {
    id: "apple-music",
    name: "Apple Music",
    icon: "🍎",
    color: "#FA243C",
    benefits: [
      "Editorial pitching",
      "Radio station features",
      "Shazam integration",
      "Behind-the-scenes content"
    ]
  },
  {
    id: "amazon",
    name: "Amazon Music",
    icon: "📦",
    color: "#FF9900",
    benefits: [
      "Playlist placement strategy",
      "Voice assistant optimization (Alexa)",
      "Distribution planning",
      "Artist storefront setup"
    ]
  }
];

function MajorPlatformPromo() {
  return (
    <div>
      <div className="promo-section-label">Platform Strategy</div>
      <h2 className="promo-section-title">
        Major Platform <span style={{ fontStyle: "italic", color: "#D94F2B" }}>Pitching</span>
      </h2>
      <p className="promo-section-sub">
        We help you navigate the complexities of pitching to Spotify, 
        Apple Music, and Amazon. No more guesswork — just real strategy 
        that gets results.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginTop: "24px"
      }}>
        {PLATFORMS.map((platform) => (
          <div
            key={platform.id}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "32px 28px",
              border: "0.5px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              transition: "transform 200ms ease, box-shadow 200ms ease",
              cursor: "default"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "32px" }}>{platform.icon}</div>
              <div>
                <div style={{ fontFamily: F.d, fontSize: "18px", fontWeight: 700, color: "#111" }}>
                  {platform.name}
                </div>
                <div style={{ 
                  width: "32px", 
                  height: "3px", 
                  borderRadius: "2px", 
                  background: platform.color,
                  marginTop: "4px"
                }} />
              </div>
            </div>

            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              {platform.benefits.map((benefit, i) => (
                <li key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13.5px",
                  color: "#555",
                  fontWeight: 300,
                  lineHeight: 1.5
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={platform.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "32px",
        padding: "24px 32px",
        background: "rgba(217,79,43,0.04)",
        borderRadius: "16px",
        border: "0.5px solid rgba(217,79,43,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ fontFamily: F.d, fontSize: "16px", fontWeight: 700, color: "#111" }}>
            Ready to pitch your music?
          </div>
          <div style={{ fontSize: "13px", color: "#888", fontWeight: 300 }}>
            Get personalized strategy for your release.
          </div>
        </div>
        <a href="/submit-track" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#D94F2B",
          color: "white",
          padding: "10px 22px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          whiteSpace: "nowrap"
        }}>
          Start Pitching
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  );
}

export default MajorPlatformPromo;