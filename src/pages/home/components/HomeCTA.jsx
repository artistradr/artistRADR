import { Link } from "react-router-dom";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeCTA() {
  return (
    <>
      <style>{`
        .h-cta { background: #D94F2B; padding: 72px 0; position: relative; overflow: hidden; }
        .h-cta-blob1 { position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.06); pointer-events: none; }
        .h-cta-blob2 { position: absolute; bottom: -80px; left: -40px; width: 250px; height: 250px; border-radius: 50%; background: rgba(0,0,0,0.1); pointer-events: none; }
      `}</style>

      <section className="h-cta">
        <div className="h-cta-blob1" />
        <div className="h-cta-blob2" />
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", padding: "0 1.5rem", position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: "16px" }}>Submit Your Music</div>
          <h2 style={{ fontFamily: F.d, fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "white", lineHeight: 1, marginBottom: "16px" }}>
            Ready to get on the RADR?
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.72)", fontWeight: 300, lineHeight: 1.75, marginBottom: "36px" }}>
            Submit your track and let us spotlight your sound to thousands of music lovers and curators.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/submit-track" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "white", color: "#D94F2B", padding: "14px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
              Submit Your Track
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "white", border: "0.5px solid rgba(255,255,255,0.3)", padding: "14px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeCTA;