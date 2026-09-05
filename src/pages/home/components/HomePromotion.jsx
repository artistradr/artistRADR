import { Link } from "react-router-dom";
import { SpotifyLogo, AppleMusicLogo, YoutubeLogo, TikTokLogo } from "components/PlatformLogos";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomePromotion() {
  return (
    <>
      <style>{`
        .h-section-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #D94F2B; margin-bottom: 8px; }
        .h-section-title { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #111; margin: 0; line-height: 1.1; }
        .h-promo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .h-promo-card {
          background: white;
          border-radius: 16px;
          padding: 28px 20px;
          border: 0.5px solid rgba(0,0,0,0.06);
          text-decoration: none;
          color: #111;
          transition: transform 220ms ease, box-shadow 220ms ease;
          text-align: center;
        }
        .h-promo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .h-promo-icon {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .h-promo-name {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #111;
          margin-bottom: 4px;
        }
        .h-promo-desc {
          font-size: 12px;
          color: #888;
          font-weight: 300;
          line-height: 1.5;
        }
        @media (max-width: 700px) {
          .h-promo-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .h-promo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section style={{ padding: "60px 0 80px", background: "#fff" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div className="h-section-label">Promotion</div>
            <h2 className="h-section-title">
              Get Your Music <span style={{ fontStyle: "italic", color: "#D94F2B" }}>Discovered</span>
            </h2>
            <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "560px", margin: "12px auto 0" }}>
              From Spotify playlists to YouTube Shorts, we help emerging artists get their music in front of the right audiences.
            </p>
          </div>

          <div className="h-promo-grid">
            {[
              { Logo: SpotifyLogo, name: "Spotify", desc: "Curated playlist placements", link: "/promotion#channels" },
              { Logo: AppleMusicLogo, name: "Apple Music", desc: "Editorial pitching", link: "/promotion#channels" },
              { Logo: YoutubeLogo, name: "YouTube", desc: "Shorts & UGC campaigns", link: "/promotion#channels" },
              { Logo: TikTokLogo, name: "TikTok", desc: "Sound promotion", link: "/promotion" },
            ].map(({ Logo, name, desc, link }) => (
              <Link key={name} to={link} className="h-promo-card">
                <div className="h-promo-icon">
                  <Logo size={32} />
                </div>
                <div className="h-promo-name">{name}</div>
                <div className="h-promo-desc">{desc}</div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <Link to="/campaigns" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#D94F2B",
              color: "white",
              padding: "12px 28px",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(217,79,43,0.35)"
            }}>
              Start Campaign
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePromotion;