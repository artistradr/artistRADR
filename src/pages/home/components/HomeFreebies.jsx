import { Link } from "react-router-dom";
import freebiesHero from "assets/images/freebies-hero.png";
import freebiesStrip from "assets/images/freebies-strip.png";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeFreebies() {
  return (
    <>
      <style>{`
        .h-freebies {
          position: relative; min-height: 70vh;
          background-image: url(${freebiesHero});
          background-size: cover; background-position: center;
          display: flex; align-items: center;
        }
        .h-freebies-overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.42) 100%); }
        .h-freebies-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; width: 100%; }
        @media (max-width: 900px) {
          .h-freebies-grid { grid-template-columns: 1fr; }
          .h-freebies-img { order: 2; max-height: 300px !important; }
          .h-freebies-text { order: 1; }
        }
      `}</style>

      <section className="h-freebies">
        <div className="h-freebies-overlay" />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "400px", height: "300px", background: "radial-gradient(ellipse at bottom right, rgba(77,217,208,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1180px", margin: "0 auto", padding: "80px 1.5rem", width: "100%" }}>
          <div className="h-freebies-grid">
            <div className="h-freebies-text">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#4DD9D0", background: "rgba(77,217,208,0.1)", border: "0.5px solid rgba(77,217,208,0.25)", borderRadius: "100px", padding: "4px 14px", marginBottom: "18px" }}>
                Toolkit
              </div>
              <h2 style={{ fontFamily: F.d, fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", lineHeight: 1.15, color: "white", marginBottom: "14px" }}>
                Free Tools for <span style={{ fontStyle: "italic", color: "#D94F2B" }}>Artists</span> &amp; Creators
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.75, marginBottom: "28px", maxWidth: "420px" }}>
                Exclusive downloads, templates, checklists, and more — designed to elevate your creative process and grow your career.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link to="/pages/toolkit/freebies" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#4DD9D0", color: "#111", padding: "12px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(77,217,208,0.35)" }}>
                  Explore Freebies
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link to="/pages/toolkit/premium-tools" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "0.5px solid rgba(255,255,255,0.2)", padding: "12px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                  Premium Tools
                </Link>
              </div>
            </div>
            <img src={freebiesStrip} alt="Freebie tools" className="h-freebies-img" style={{ width: "100%", maxHeight: "520px", objectFit: "contain" }} />
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeFreebies;