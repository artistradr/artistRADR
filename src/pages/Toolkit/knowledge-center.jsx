import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const CATEGORIES = ["All", "Distribution", "Marketing", "Sync & Licensing", "Deals & Business", "Production"];

const ARTICLES = [
  {
    id: 1,
    category: "Distribution",
    tag: "Distribution",
    color: "#D94F2B",
    title: "How to Pitch Your Music to Spotify Editorial Playlists",
    desc: "A step-by-step breakdown of Spotify for Artists' pitch tool, what curators look for, and how to write a pitch that actually gets read.",
    readTime: "8 min read",
    featured: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
  {
    id: 2,
    category: "Marketing",
    tag: "Marketing",
    color: "#4DD9D0",
    title: "The 30-Day Pre-Release Playbook for Independent Artists",
    desc: "Everything you need to do in the month before your release — from promo rollout timelines to playlist pitching windows and content strategy.",
    readTime: "12 min read",
    featured: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 3,
    category: "Deals & Business",
    tag: "Deals & Business",
    color: "#D94F2B",
    title: "Understanding Your Record Deal: Advances, Splits & Recoupment",
    desc: "Plain-English explanations of the most common clauses in label contracts — what they mean, what to negotiate, and what to walk away from.",
    readTime: "15 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: 4,
    category: "Sync & Licensing",
    tag: "Sync & Licensing",
    color: "#4DD9D0",
    title: "How to License Your Music for TV, Film & Ads",
    desc: "The sync licensing landscape demystified — who the players are, how placements happen, what music supervisors want, and how to get in the room.",
    readTime: "10 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    id: 5,
    category: "Marketing",
    tag: "Marketing",
    color: "#D94F2B",
    title: "Building a Fanbase From Zero: The Long Game Strategy",
    desc: "How independent artists with no label, no budget, and no connections have built sustainable audiences — and the repeatable patterns behind it.",
    readTime: "11 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 6,
    category: "Distribution",
    tag: "Distribution",
    color: "#4DD9D0",
    title: "Choosing the Right Distributor in 2025: A Side-by-Side Breakdown",
    desc: "DistroKid vs TuneCore vs CD Baby vs Amuse — fees, splits, speed, and features compared so you can make the right call for your situation.",
    readTime: "9 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    id: 7,
    category: "Production",
    tag: "Production",
    color: "#D94F2B",
    title: "Mastering Basics Every Artist Should Know Before Releasing",
    desc: "You don't need to master your own music — but you do need to understand what good mastering sounds like and what to ask for.",
    readTime: "7 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
  },
  {
    id: 8,
    category: "Deals & Business",
    tag: "Deals & Business",
    color: "#4DD9D0",
    title: "Publishing 101: Owning Your Masters & Protecting Your Royalties",
    desc: "Master vs publishing rights, PROs, work-for-hire traps, and why registering your songs properly is the most overlooked career move.",
    readTime: "13 min read",
    featured: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
];

export default function KnowledgeCenter() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === activeCategory);

  const featured = filtered.filter((a) => a.featured);
  const rest = filtered.filter((a) => !a.featured);

  return (
    <>
      <style>{`
        /* ── Featured card ── */
        .kc-featured {
          background: white;
          border-radius: 18px;
          border: 0.5px solid rgba(0,0,0,0.08);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
          transition: transform 200ms ease, box-shadow 200ms ease;
          cursor: default;
        }
        .kc-featured::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--color-red,#D94F2B) 0%, #4DD9D0 100%);
          opacity: 0; transition: opacity 200ms ease;
        }
        .kc-featured:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.09); }
        .kc-featured:hover::before { opacity: 1; }

        .kc-featured-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 700px) { .kc-featured-grid { grid-template-columns: 1fr; } }

        /* ── Regular article card ── */
        .kc-card {
          background: white;
          border-radius: 18px;
          border: 0.5px solid rgba(0,0,0,0.08);
          padding: 24px 28px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          position: relative;
          overflow: hidden;
          transition: transform 200ms ease, box-shadow 200ms ease;
          cursor: default;
        }
        .kc-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--color-red,#D94F2B) 0%, #4DD9D0 100%);
          opacity: 0; transition: opacity 200ms ease;
        }
        .kc-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
        .kc-card:hover::before { opacity: 1; }

        .kc-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) { .kc-grid { grid-template-columns: 1fr; } }

        /* ── Coming soon overlay ── */
        .kc-coming-overlay {
          position: absolute;
          inset: 0;
          background: rgba(247,246,243,0.78);
          backdrop-filter: blur(2.5px);
          -webkit-backdrop-filter: blur(2.5px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          z-index: 10;
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .kc-featured:hover .kc-coming-overlay,
        .kc-card:hover .kc-coming-overlay { opacity: 1; }

        .kc-coming-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #111;
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          padding: 9px 18px;
          border-radius: 100px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.22);
          transform: translateY(4px);
          transition: transform 180ms ease;
        }
        .kc-featured:hover .kc-coming-pill,
        .kc-card:hover .kc-coming-pill { transform: translateY(0); }

        /* ── Category filter pills ── */
        .kc-filter-pill {
          display: inline-flex;
          align-items: center;
          padding: 7px 16px;
          border-radius: 100px;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          border: 0.5px solid rgba(0,0,0,0.12);
          background: white;
          color: #666;
          cursor: pointer;
          transition: all 150ms ease;
          white-space: nowrap;
        }
        .kc-filter-pill:hover { border-color: #D94F2B; color: #D94F2B; }
        .kc-filter-pill.active {
          background: #111; color: white; border-color: #111;
        }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%", padding: "120px 1.5rem 0" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", paddingBottom: "40px", borderBottom: "0.5px solid rgba(0,0,0,0.09)", marginBottom: "52px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
                Toolkit · Knowledge
              </div>
              <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.8rem, 6vw, 4.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: "0 0 14px" }}>
                Knowledge Center
              </h1>
              <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "440px", margin: 0 }}>
                Guides, playbooks, and deep-dives for <span style={{ fontStyle: "italic", color: "#111" }}>independent artists</span> building real careers.
              </p>
            </div>

            {/* Coming soon card */}
            <div style={{ background: "#111", borderRadius: "16px", border: "0.5px solid rgba(255,255,255,0.06)", padding: "28px", minWidth: "280px", maxWidth: "340px", width: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-30px", left: "60px", width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,217,208,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  {["#D94F2B", "#4DD9D0", "#D94F2B"].map((c, i) => (
                    <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, opacity: 1 - i * 0.25 }} />
                  ))}
                </div>
                <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "white", marginBottom: "6px" }}>Guides Dropping Soon</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 300, lineHeight: 1.6, marginBottom: "18px" }}>
                  Every article below is in production. Hover any card to see what's coming.
                </p>
                <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "#D94F2B", color: "white", padding: "11px 20px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(217,79,43,0.4)" }}>
                  Submit Your Track
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "52px" }}>
            {[
              { num: "8+", label: "Guides in production", color: "#D94F2B" },
              { num: "5", label: "Topics covered", color: "#4DD9D0" },
              { num: "∞", label: "Career value inside", color: "#D94F2B" },
            ].map(({ num, label, color }) => (
              <div key={label} style={{ background: "#111", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
                <div style={{ fontFamily: F.d, fontSize: "2.2rem", fontWeight: 800, color, letterSpacing: "1px", lineHeight: 1, marginBottom: "6px" }}>{num}</div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Category filters ── */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`kc-filter-pill${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Featured guides ── */}
          {featured.length > 0 && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "6px" }}>Featured</div>
                <div style={{ fontFamily: F.d, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111" }}>
                  Start here
                </div>
              </div>
              <div className="kc-featured-grid">
                {featured.map(({ id, title, desc, tag, color, readTime, icon }) => (
                  <div key={id} className="kc-featured">
                    <div className="kc-coming-overlay">
                      <span className="kc-coming-pill">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Coming soon
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${color}14`, color, border: `0.5px solid ${color}44` }}>{tag}</span>
                      <span style={{ fontSize: "9px", fontWeight: 500, color: "#bbb", letterSpacing: "0.5px" }}>{readTime}</span>
                    </div>
                    <div style={{ color: color }}>{icon}</div>
                    <div>
                      <div style={{ fontFamily: F.d, fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111", marginBottom: "8px", lineHeight: 1.2 }}>{title}</div>
                      <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{desc}</p>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#bbb", marginTop: "4px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Read guide
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── All other articles ── */}
          {rest.length > 0 && (
            <>
              <div style={{ margin: "44px 0 20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "6px" }}>
                  {activeCategory === "All" ? "All guides" : activeCategory}
                </div>
                <div style={{ fontFamily: F.d, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111" }}>
                  {activeCategory === "All" ? "Browse everything" : `${activeCategory} guides`}
                </div>
              </div>
              <div className="kc-grid" style={{ marginBottom: "80px" }}>
                {rest.map(({ id, title, desc, tag, color, readTime, icon }) => (
                  <div key={id} className="kc-card">
                    <div className="kc-coming-overlay">
                      <span className="kc-coming-pill">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Coming soon
                      </span>
                    </div>
                    {/* Icon */}
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${color}44`, color: "white" }}>
                      {icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${color}14`, color, border: `0.5px solid ${color}44` }}>{tag}</span>
                        <span style={{ fontSize: "9px", fontWeight: 500, color: "#bbb" }}>{readTime}</span>
                      </div>
                      <div style={{ fontFamily: F.d, fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111", marginBottom: "6px", lineHeight: 1.2 }}>{title}</div>
                      <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb", fontSize: "13px" }}>
              No guides in this category yet — check back soon.
            </div>
          )}

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
                Don&apos;t wait for the guides — get your music in front of thousands of listeners right now.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <a href="https://io.artistradr.com/playlist-submission-form" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#D94F2B", color: "white", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(217,79,43,0.4)" }}>
                Submit Track →
              </a>
              <Link to="/pages/toolkit/premium-tools" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Premium Tools
              </Link>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </>
  );
}