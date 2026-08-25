import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const FREEBIES = [
  {
    id: 1,
    title: "Artist Press Kit Template",
    desc: "A professional EPK template to pitch yourself to blogs, labels, and curators. Plug in your info and go.",
    tag: "Template",
    color: "#D94F2B",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    status: "coming",
  },
  {
    id: 2,
    title: "Music Release Checklist",
    desc: "A 40-point checklist covering everything from pre-release strategy to post-release promotion.",
    tag: "Checklist",
    color: "#4DD9D0",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    status: "coming",
  },
  {
    id: 3,
    title: "Spotify Pitch Email Template",
    desc: "Word-for-word email templates to pitch your music to playlist curators on Spotify and beyond.",
    tag: "Template",
    color: "#D94F2B",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    status: "coming",
  },
  {
    id: 4,
    title: "Social Media Content Calendar",
    desc: "A 30-day content calendar built for artists — with post ideas, captions, and scheduling tips.",
    tag: "Calendar",
    color: "#4DD9D0",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    status: "coming",
  },
  {
    id: 5,
    title: "Artist Bio Writing Guide",
    desc: "Learn how to write a compelling short and long bio that gets you booked, featured, and remembered.",
    tag: "Guide",
    color: "#D94F2B",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    status: "coming",
  },
  {
    id: 6,
    title: "Playlist Submission Database",
    desc: "A curated list of 100+ playlist curators with contact info, genre tags, and submission guidelines.",
    tag: "Database",
    color: "#4DD9D0",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    status: "coming",
  },
];

export default function Freebies() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        .fb-card {
          background: white; border-radius: 18px; border: 0.5px solid rgba(0,0,0,0.08);
          padding: 28px; display: flex; flex-direction: column; gap: 14px;
          transition: transform 200ms ease, box-shadow 200ms ease;
          position: relative; overflow: hidden;
        }
        .fb-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.09); }
        .fb-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--color-red) 0%, var(--color-cyan) 100%);
          opacity: 0; transition: opacity 200ms ease;
        }
        .fb-card:hover::before { opacity: 1; }

        .fb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) { .fb-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 580px) { .fb-grid { grid-template-columns: 1fr; } }

        .fb-notify-input {
          flex: 1; padding: 13px 16px;
          border: 0.5px solid rgba(0,0,0,0.14); border-radius: 10px;
          font-family: var(--font-body); font-size: 14px; color: #111;
          background: white; outline: none;
          transition: border-color 150ms ease;
        }
        .fb-notify-input:focus { border-color: #D94F2B; }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        {/* ── Hero ── */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%", padding: "120px 1.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", paddingBottom: "40px", borderBottom: "0.5px solid rgba(0,0,0,0.09)", marginBottom: "52px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
                 Toolkit · Free Resources
              </div>
              <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.8rem, 6vw, 4.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: "0 0 14px" }}>
                Freebies
              </h1>
              <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "440px", margin: 0 }}>
                Free tools, templates, and resources built for <span style={{ fontStyle: "italic", color: "#111" }}>artists</span> and creators. No cost, no catch.
              </p>
            </div>
            {/* Notify form */}
            <div style={{ background: "white", borderRadius: "16px", border: "0.5px solid rgba(0,0,0,0.08)", padding: "24px 28px", minWidth: "300px", maxWidth: "360px", width: "100%" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#D94F2B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>You&apos;re on the list!</div>
                  <p style={{ fontSize: "12px", color: "#aaa", fontWeight: 300 }}>We&apos;ll email you as soon as new resources drop.</p>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", color: "#111" }}>Get notified first</div>
                  <p style={{ fontSize: "12px", color: "#aaa", fontWeight: 300, lineHeight: 1.6, marginBottom: "14px" }}>New resources drop regularly. Be the first to know.</p>
                  <form onSubmit={handleNotify} style={{ display: "flex", gap: "8px" }}>
                    <input type="email" className="fb-notify-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <button type="submit" style={{ background: "#D94F2B", color: "white", border: "none", borderRadius: "10px", padding: "13px 16px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(217,79,43,0.3)" }}>
                      Notify me
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "52px" }}>
            {[
              { num: "6+", label: "Resources dropping soon", color: "#D94F2B" },
              { num: "100%", label: "Completely free", color: "#4DD9D0" },
              { num: "∞", label: "Value for your career", color: "#D94F2B" },
            ].map(({ num, label, color }) => (
              <div key={label} style={{ background: "#111", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
                <div style={{ fontFamily: F.d, fontSize: "2.2rem", fontWeight: 800, color, letterSpacing: "1px", lineHeight: 1, marginBottom: "6px" }}>{num}</div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Resources grid ── */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>Coming soon</div>
            <div style={{ fontFamily: F.d, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "28px" }}>
              What&apos;s dropping
            </div>
          </div>

          <div className="fb-grid" style={{ marginBottom: "80px" }}>
            {FREEBIES.map(({ id, title, desc, tag, color, icon }) => (
              <div key={id} className="fb-card">
                {/* Icon */}
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${color}55` }}>
                  {icon}
                </div>
                {/* Tag */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${color}14`, color, border: `0.5px solid ${color}44` }}>{tag}</span>
                  <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#ccc", padding: "3px 10px", borderRadius: "100px", background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.08)" }}>Coming soon</span>
                </div>
                {/* Content */}
                <div>
                  <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111", marginBottom: "8px", lineHeight: 1.2 }}>{title}</div>
                  <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{desc}</p>
                </div>
                {/* Download placeholder */}
                <button disabled style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.1)", color: "#bbb", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "not-allowed", marginTop: "4px", width: "fit-content" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download free
                </button>
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{ background: "#111", borderRadius: "20px", padding: "48px", marginBottom: "80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "200px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,217,208,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "10px" }}>Ready now?</div>
              <div style={{ fontFamily: F.d, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.1, marginBottom: "10px" }}>
                Submit Your Track Today
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.7, margin: 0, maxWidth: "380px" }}>
                Don&apos;t wait for the freebies — get your music in front of thousands of listeners right now.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#D94F2B", color: "white", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(217,79,43,0.4)" }}>
                Submit Track →
              </a>
              <Link to="/pages/toolkit/knowledge-center" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Knowledge Center
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}