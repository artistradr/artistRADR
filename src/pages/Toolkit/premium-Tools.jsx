import { Link } from "react-router-dom";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const TOOLS = [
  {
    id: 1,
    title: "Playlist Pitch Tracker",
    desc: "Track every curator you've pitched — status, follow-up dates, response rates, and notes all in one place.",
    tag: "Tracker",
    color: "#D94F2B",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    id: 2,
    title: "A&R Contact Database",
    desc: "A curated, regularly updated database of A&R reps, managers, and label contacts sorted by genre and tier.",
    tag: "Database",
    color: "#4DD9D0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    id: 3,
    title: "Release Planner",
    desc: "A full release calendar with pre-release milestones, DSP deadlines, promo windows, and post-release tasks.",
    tag: "Calendar",
    color: "#D94F2B",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 4,
    title: "Royalty Calculator",
    desc: "Estimate your streaming, sync, and mechanical royalties based on plays, territory, and distributor split.",
    tag: "Calculator",
    color: "#4DD9D0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
        <line x1="8" y1="18" x2="12" y2="18"/>
      </svg>
    ),
  },
  {
    id: 5,
    title: "Sync Licensing Guide",
    desc: "Step-by-step breakdown of how to license your music for TV, film, and ads — with pitch templates included.",
    tag: "Guide",
    color: "#D94F2B",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
  {
    id: 6,
    title: "Label Deal Analyzer",
    desc: "Break down a record deal contract into plain terms — understand splits, advances, and clauses before you sign.",
    tag: "Analyzer",
    color: "#4DD9D0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default function PremiumTools() {
  return (
    <>
      <style>{`
        /* ── Card base — mirrors .fb-card exactly ── */
        .pt-card {
          background: white;
          border-radius: 18px;
          border: 0.5px solid rgba(0,0,0,0.08);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }

        /* Top-edge gradient line — gold instead of red→cyan to signal premium */
        .pt-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #c8922a 0%, #e8c76a 100%);
          opacity: 0;
          transition: opacity 200ms ease;
        }
        .pt-card:hover::before { opacity: 1; }
        .pt-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.09);
        }

        /* Frosted lock overlay — sits on top, dims but doesn't destroy the card */
        .pt-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(247,246,243,0.72);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          z-index: 10;
          cursor: pointer;
          transition: background 200ms ease;
        }
        .pt-card:hover .pt-card-overlay {
          background: rgba(247,246,243,0.55);
        }

        .pt-lock-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #111;
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          padding: 9px 18px;
          border-radius: 100px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.22);
          text-decoration: none;
          transition: background 150ms ease, transform 150ms ease;
        }
        .pt-card:hover .pt-lock-pill {
          background: #D94F2B;
          transform: scale(1.04);
        }

        /* 3-col grid — identical to .fb-grid */
        .pt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) { .pt-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) { .pt-grid { grid-template-columns: 1fr; } }

        .pt-access-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #D94F2B;
          color: white;
          padding: 13px 24px;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(217,79,43,0.4);
          transition: opacity 150ms ease;
        }
        .pt-access-btn:hover { opacity: 0.88; }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%", padding: "120px 1.5rem 0" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", paddingBottom: "40px", borderBottom: "0.5px solid rgba(0,0,0,0.09)", marginBottom: "52px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
                Toolkit · Premium
              </div>
              <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.8rem, 6vw, 4.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: "0 0 14px" }}>
                Premium Tools
              </h1>
              <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "440px", margin: 0 }}>
                Exclusive tools built for <span style={{ fontStyle: "italic", color: "#111" }}>serious artists</span>. Subscribe to unlock full access.
              </p>
            </div>

            {/* Access card — dark, gold-accented */}
            <div style={{ background: "#111", borderRadius: "16px", border: "0.5px solid rgba(255,255,255,0.06)", padding: "28px", minWidth: "300px", maxWidth: "360px", width: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,146,42,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-40px", left: "-20px", width: "130px", height: "130px", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,217,208,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #c8922a, #e8c76a)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 4px 14px rgba(200,146,42,0.45)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "white", marginBottom: "6px" }}>Subscribers Only</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 300, lineHeight: 1.6, marginBottom: "18px" }}>
                  All tools are unlocked with a RADR subscription. More dropping soon.
                </p>
                <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" className="pt-access-btn">
                  Get Access
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "52px" }}>
            {[
              { num: "6+", label: "Tools available now", color: "#c8922a" },
              { num: "∞", label: "More features dropping", color: "#4DD9D0" },
              { num: "1", label: "Subscription unlocks all", color: "#c8922a" },
            ].map(({ num, label, color }) => (
              <div key={label} style={{ background: "#111", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
                <div style={{ fontFamily: F.d, fontSize: "2.2rem", fontWeight: 800, color, letterSpacing: "1px", lineHeight: 1, marginBottom: "6px" }}>{num}</div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Section label ── */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#c8922a", marginBottom: "8px" }}>Members only</div>
            <div style={{ fontFamily: F.d, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "28px" }}>
              What&apos;s inside
            </div>
          </div>

          {/* ── Tools grid ── */}
          <div className="pt-grid" style={{ marginBottom: "80px" }}>
            {TOOLS.map(({ id, title, desc, tag, color, icon }) => (
              <div key={id} className="pt-card">

                {/* Frosted overlay with lock pill */}
                <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" className="pt-card-overlay">
                  <span className="pt-lock-pill">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Unlock
                  </span>
                </a>

                {/* Card content — full color, fully rendered under the overlay */}
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${color}55` }}>
                  {icon}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${color}14`, color, border: `0.5px solid ${color}44` }}>{tag}</span>
                  <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#c8922a", padding: "3px 10px", borderRadius: "100px", background: "rgba(200,146,42,0.07)", border: "0.5px solid rgba(200,146,42,0.2)" }}>Premium</span>
                </div>

                <div>
                  <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111", marginBottom: "8px", lineHeight: 1.2 }}>{title}</div>
                  <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{desc}</p>
                </div>

                <button disabled style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.1)", color: "#bbb", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "not-allowed", marginTop: "4px", width: "fit-content" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Subscribers only
                </button>
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{ background: "#111", borderRadius: "20px", padding: "48px", marginBottom: "80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,146,42,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "200px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,217,208,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#c8922a", marginBottom: "10px" }}>Unlock everything</div>
              <div style={{ fontFamily: F.d, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.1, marginBottom: "10px" }}>
                Get Full Access Today
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.7, margin: 0, maxWidth: "380px" }}>
                Subscribe to RADR and unlock all premium tools, plus submit your music to thousands of listeners.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" className="pt-access-btn">
                Get Access →
              </a>
              <Link to="/pages/toolkit/freebies" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Free Resources
              </Link>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </>
  );
}