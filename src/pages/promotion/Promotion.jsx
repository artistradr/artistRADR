import { useEffect } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";

import PromotionHero from "./components/PromotionHero";
import EditorialPlaylists from "./components/EditorialPlaylists";
import MajorPlatformPromo from "./components/MajorPlatformPromo";
import YoutubeUGC from "./components/YoutubeUGC";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function Promotion() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEOHead
        title="Promotion — Get Your Music Heard"
        description="Promote your music across Spotify, Apple Music, YouTube, and more. Get curated playlist placements, UGC creator campaigns, and industry exposure."
        path="/promotion"
      />

      <style>{`
        .promo-section {
          padding: 80px 0;
          background: #f7f6f3;
        }
        .promo-section:nth-child(even) {
          background: #fff;
        }
        .promo-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .promo-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #D94F2B;
          margin-bottom: 8px;
        }
        .promo-section-title {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #111;
          margin: 0 0 12px;
          line-height: 1.1;
        }
        .promo-section-sub {
          font-size: 15px;
          color: #666;
          font-weight: 300;
          line-height: 1.7;
          max-width: 600px;
          margin-bottom: 32px;
        }
        @media (max-width: 700px) {
          .promo-section {
            padding: 56px 0;
          }
        }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }} />

        {/* Page header with breadcrumbs */}
        <div style={{ 
          maxWidth: "1180px", 
          margin: "0 auto", 
          padding: "100px 1.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Promotion", path: "/promotion" }]} />
        </div>

        {/* Hero Section */}
        <PromotionHero />

        {/* Editorial Playlists Section */}
        <section className="promo-section">
          <div className="promo-container">
            <EditorialPlaylists />
          </div>
        </section>

        {/* Major Platform Promo Section */}
        <section className="promo-section">
          <div className="promo-container">
            <MajorPlatformPromo />
          </div>
        </section>

        {/* YouTube UGC Section */}
        <section className="promo-section">
          <div className="promo-container">
            <YoutubeUGC />
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ background: "#D94F2B", padding: "72px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-80px", left: "-40px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(0,0,0,0.1)", pointerEvents: "none" }} />
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", padding: "0 1.5rem", position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: "16px" }}>Ready to Get Started?</div>
            <h2 style={{ fontFamily: F.d, fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "white", lineHeight: 1, marginBottom: "16px" }}>
              Get Your Music on the RADR
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.72)", fontWeight: 300, lineHeight: 1.75, marginBottom: "36px" }}>
              Launch a campaign and let us help you get discovered across Spotify, Apple Music, YouTube, and beyond.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "white", color: "#D94F2B", padding: "14px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                Start Campaign
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "white", border: "0.5px solid rgba(255,255,255,0.3)", padding: "14px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Read Success Stories
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Promotion;