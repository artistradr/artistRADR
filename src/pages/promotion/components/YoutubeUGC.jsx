import { Link } from "react-router-dom";
import { YoutubeLogo } from "components/PlatformLogos";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const YOUTUBE_URL = "https://www.youtube.com/@ArtistRADR";

const UGC_CAMPAIGNS = [
  {
    id: "shorts",
    name: "YouTube Shorts",
    icon: "📱",
    description: "Get your music featured in YouTube Shorts campaigns. Short-form content is the fastest way to viral discovery.",
    benefits: [
      "30-60 second clips",
      "Trending sound placement",
      "Creator collaboration",
      "Viral potential"
    ]
  },
  {
    id: "ugc",
    name: "UGC Creator Program",
    icon: "🎬",
    description: "Connect with content creators who use your music in their videos. Organic reach through authentic creator content.",
    benefits: [
      "Creator-to-creator matching",
      "Usage rights management",
      "Performance tracking",
      "Community engagement"
    ]
  },
  {
    id: "challenges",
    name: "Music Challenges",
    icon: "🔥",
    description: "Launch viral challenges around your track. Get users creating content with your music organically.",
    benefits: [
      "Brandable challenge hashtags",
      "User-generated content",
      "Trending algorithm boost",
      "Community building"
    ]
  }
];

function YoutubeUGC() {
  return (
    <div>
      <div className="promo-section-label">Video & Content</div>
      <h2 className="promo-section-title">
        YouTube <span style={{ fontStyle: "italic", color: "#D94F2B" }}>UGC</span> & Shorts
      </h2>
      <p className="promo-section-sub">
        Leverage the power of YouTube Shorts and user-generated content 
        to amplify your reach. We connect you with creators who love 
        discovering new music.
      </p>

      {/* YouTube Channel CTA */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "20px 28px",
        background: "rgba(255,0,0,0.04)",
        borderRadius: "16px",
        border: "0.5px solid rgba(255,0,0,0.12)",
        marginBottom: "32px",
        flexWrap: "wrap"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "0.5px solid rgba(255,0,0,0.15)"
        }}>
          <YoutubeLogo size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.d, fontSize: "16px", fontWeight: 700, color: "#111" }}>
            Subscribe to Artist RADR on YouTube
          </div>
          <div style={{ fontSize: "13px", color: "#666", fontWeight: 300 }}>
            Join our community for exclusive content and artist spotlights.
          </div>
        </div>
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#FF0000",
            color: "white",
            padding: "10px 22px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap"
          }}
        >
          Subscribe
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>

      {/* Campaign Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px"
      }}>
        {UGC_CAMPAIGNS.map((campaign) => (
          <div
            key={campaign.id}
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
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>{campaign.icon}</div>
            <div style={{ fontFamily: F.d, fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: "8px" }}>
              {campaign.name}
            </div>
            <div style={{ fontSize: "14px", color: "#888", fontWeight: 300, lineHeight: 1.6, marginBottom: "16px" }}>
              {campaign.description}
            </div>

            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {campaign.benefits.map((benefit, i) => (
                <li key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12.5px",
                  color: "#555",
                  fontWeight: 300,
                  lineHeight: 1.5
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Learn More CTA */}
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
          Get Started with Video Promotion
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    </div>
  );
}

export default YoutubeUGC;