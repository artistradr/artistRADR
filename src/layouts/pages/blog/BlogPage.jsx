import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { safeHtml } from "../../../utils/sanitizeHtml";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// `value` must match the slugified `category` stored on each post row
// (see mapCategory() in scripts/migrate-wp-to-supabase.mjs and PostEditor.jsx's dropdown).
// Keep this list in sync with:
//  - public.posts_category_check (DB constraint, Supabase project rjivkemajotafjvtalol)
//  - PostEditor.jsx's CATEGORIES
//  - AdminDashboard.jsx's POST_CATEGORIES
const CATEGORIES = [
  { label: "All",          value: "all" },
  { label: "New Release",  value: "new-release" },
  { label: "On Your RADR", value: "on-your-radr" },
  { label: "Spotlights",   value: "spotlights" },
  { label: "Playlist",     value: "playlist" },
  { label: "Single",       value: "single" },
  { label: "Album",        value: "album" },
  { label: "EP",           value: "ep" },
  { label: "News",         value: "news" },
  { label: "Updates",      value: "updates" },
  { label: "Trending",     value: "trending" },
];

// A post only counts as "actively" pinned while featured_until is in the
// future. Once it lapses, this returns false and the post stops being
// eligible as the hero on the next render — no cron job, no admin action.
function isActivelyFeatured(post) {
  return Boolean(post.featured_slot) && Boolean(post.featured_until) && new Date(post.featured_until) > new Date();
}

function BlogPage() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        setPosts(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Close mobile category dropdown on outside click/tap.
  useEffect(() => {
    if (!catOpen) return;
    const handleOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [catOpen]);

  const filtered = posts.filter((p) => {
    const matchSearch = search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "all" || p.category === filter;
    return matchSearch && matchCat;
  });

  // Hero selection: on the default unfiltered/unsearched view, prefer the
  // active pin with the lowest slot number. Otherwise (no active pin, or
  // the user is filtering/searching) fall back to the newest matching post
  // — same as the pre-pinning behavior. Slots 2/3, if pinned, get no
  // special treatment; they just sit wherever their publish date puts them
  // in the regular grid below.
  const isDefaultView = filter === "all" && search === "";
  const activePins = isDefaultView
    ? posts.filter(isActivelyFeatured).sort((a, b) => a.featured_slot - b.featured_slot)
    : [];
  const featured = activePins[0] || filtered[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);

  const categoryLabel = (value) =>
    CATEGORIES.find((c) => c.value === value)?.label || value || "";

  return (
    <>
      <style>{`
        @keyframes pulse { from { opacity: 0.55; } to { opacity: 1; } }

        .bp-filter-btn {
          padding: 7px 16px; border-radius: 100px; cursor: pointer;
          font-family: var(--font-body); font-size: 12px; font-weight: 600;
          letter-spacing: 0.5px; border: 0.5px solid; transition: all 150ms ease;
          white-space: nowrap;
        }
        .bp-filter-btn.active {
          background: #D94F2B; border-color: #D94F2B; color: white;
        }
        .bp-filter-btn.inactive {
          background: transparent; border-color: rgba(0,0,0,0.15); color: #666;
        }
        .bp-filter-btn.inactive:hover {
          border-color: #D94F2B; color: #D94F2B;
        }

        .bp-card {
          background: white; border-radius: 16px; border: 0.5px solid rgba(0,0,0,0.07);
          overflow: hidden; text-decoration: none; color: #111;
          display: flex; flex-direction: column;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .bp-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(0,0,0,0.09); }
        .bp-card:hover .bp-read-more { color: #D94F2B; }

        .bp-read-more {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; color: #aaa;
          transition: color 150ms ease;
        }
        .bp-read-more svg { transition: transform 150ms ease; }
        .bp-card:hover .bp-read-more svg { transform: translateX(3px); }

        .bp-recent-link {
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; color: #111;
          padding-bottom: 14px; margin-bottom: 14px;
          border-bottom: 0.5px solid rgba(0,0,0,0.06);
          transition: opacity 150ms ease;
        }
        .bp-recent-link:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
        .bp-recent-link:hover { opacity: 0.7; }

        .bp-search {
          width: 100%; box-sizing: border-box;
          padding: 10px 16px 10px 38px;
          border: 0.5px solid rgba(0,0,0,0.14); border-radius: 100px;
          font-family: var(--font-body); font-size: 13px; color: #111;
          background: white; outline: none;
          transition: border-color 150ms ease;
        }
        .bp-search:focus { border-color: #D94F2B; }

        /* Featured card */
        .bp-featured {
          display: grid; grid-template-columns: 1fr 1fr;
          background: white; border-radius: 20px; border: 0.5px solid rgba(0,0,0,0.07);
          overflow: hidden; text-decoration: none; color: #111; margin-bottom: 40px;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .bp-featured:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.10); }
        .bp-featured:hover .bp-read-more { color: #D94F2B; }

        /* Mobile category dropdown (hidden on desktop) */
        .bp-cat-dropdown { display: none; }
        .bp-pills-desktop { display: flex; gap: 8px; flex-wrap: wrap; }

        @media (max-width: 860px) {
          .bp-layout { grid-template-columns: 1fr !important; }
          .bp-sidebar { position: static !important; }
          .bp-featured { grid-template-columns: 1fr !important; }
          .bp-featured-img { height: 240px !important; }
        }
        @media (max-width: 600px) {
          .bp-grid { grid-template-columns: 1fr !important; }
          .bp-filter-row { flex-wrap: nowrap !important; }
          .bp-pills-desktop { display: none !important; }
          .bp-cat-dropdown { display: block !important; position: relative; flex-shrink: 0; }
          .bp-cat-dropdown-btn {
            display: flex; align-items: center; gap: 6px;
            padding: 7px 14px; border-radius: 100px;
            background: #D94F2B; border: 0.5px solid #D94F2B; color: white;
            font-family: var(--font-body); font-size: 12px; font-weight: 600;
            letter-spacing: 0.5px; cursor: pointer; white-space: nowrap;
          }
          .bp-cat-dropdown-menu {
            position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
            background: white; border-radius: 12px; border: 0.5px solid rgba(0,0,0,0.08);
            box-shadow: 0 12px 32px rgba(0,0,0,0.14);
            min-width: 180px; max-height: 280px; overflow-y: auto; padding: 6px;
          }
          .bp-cat-dropdown-item {
            display: block; width: 100%; text-align: left;
            padding: 9px 12px; border-radius: 8px; border: none; background: none;
            font-family: var(--font-body); font-size: 13px; color: #444; cursor: pointer;
          }
          .bp-cat-dropdown-item:hover { background: #f7f6f3; }
          .bp-cat-dropdown-item.active { color: #D94F2B; font-weight: 700; background: rgba(217,79,43,0.08); }
        }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        {/* ── Page header — no image, editorial masthead ── */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "110px 1.5rem 0" }}>

          {/* Masthead */}
          <div style={{ borderBottom: "0.5px solid rgba(0,0,0,0.1)", paddingBottom: "28px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
                  Artist RADR · Editorial
                </div>
                <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: 0 }}>
                  On Your RADR
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, lineHeight: 1.7, maxWidth: "320px", margin: 0 }}>
                Emerging artists, new releases, and stories worth knowing — curated for music lovers.
              </p>
            </div>
          </div>

          {/* ── Filter + Search row ── */}
          <div className="bp-filter-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "36px", flexWrap: "wrap" }}>

            {/* Desktop pill row */}
            <div className="bp-pills-desktop">
              {CATEGORIES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`bp-filter-btn ${filter === value ? "active" : "inactive"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile category dropdown — single pill, opens a list */}
            <div className="bp-cat-dropdown" ref={catDropdownRef}>
              <button
                type="button"
                className="bp-cat-dropdown-btn"
                onClick={() => setCatOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={catOpen}
              >
                {categoryLabel(filter)}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {catOpen && (
                <div className="bp-cat-dropdown-menu" role="listbox">
                  {CATEGORIES.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={filter === value}
                      className={`bp-cat-dropdown-item${filter === value ? " active" : ""}`}
                      onClick={() => {
                        setFilter(value);
                        setCatOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{ position: "relative", minWidth: "200px", flex: "1 1 auto" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="bp-search"
                placeholder="Search articles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── Main layout ── */}
          <div className="bp-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "48px", alignItems: "start", paddingBottom: "100px" }}>

            {/* Posts */}
            <div>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} style={{ height: "300px", borderRadius: "16px", background: "#eeecea", animation: "pulse 1.5s ease infinite alternate" }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎵</div>
                  <div style={{ fontFamily: F.d, fontSize: "1.2rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#111" }}>No posts found</div>
                  <div style={{ fontSize: "13px" }}>Try a different filter or search term</div>
                </div>
              ) : (
                <>
                  {/* Featured post — large card. Pulls the lowest-numbered
                      active pin on the default view; otherwise falls back
                      to the newest matching post. */}
                  {featured && (
                    <Link to={`/blog/${featured.slug}`} className="bp-featured">
                      <div className="bp-featured-img" style={{ height: "360px", overflow: "hidden", position: "relative" }}>
                        {featured.cover_url
                          ? <img src={featured.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          : <div style={{ width: "100%", height: "100%", background: "#eeecea" }} />
                        }
                        {/* Featured badge */}
                        <div style={{ position: "absolute", top: "16px", left: "16px", background: "#D94F2B", color: "white", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "4px 10px", borderRadius: "100px" }}>
                          Featured
                        </div>
                      </div>
                      <div style={{ padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>
                            {featured.author_name || "Artist RADR"} · {new Date(featured.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </div>
                          <div style={{ fontFamily: F.d, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1.15, color: "#111", marginBottom: "16px" }}
                            dangerouslySetInnerHTML={safeHtml(featured.title, { inline: true })} />
                          <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.7, fontWeight: 300 }}>
                            {(featured.excerpt || "").slice(0, 160)}…
                          </div>
                        </div>
                        <span className="bp-read-more" style={{ marginTop: "24px" }}>
                          Read full article
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Rest of posts grid */}
                  {rest.length > 0 && (
                    <div className="bp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                      {rest.map((post) => {
                        const date = new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        return (
                          <Link to={`/blog/${post.slug}`} key={post.id} className="bp-card">
                            <div style={{ position: "relative", overflow: "hidden" }}>
                              {post.cover_url
                                ? <img src={post.cover_url} alt="" style={{ width: "100%", height: "190px", objectFit: "cover", display: "block", transition: "transform 300ms ease" }} />
                                : <div style={{ width: "100%", height: "190px", background: "#eeecea" }} />
                              }
                              {post.category && (
                                <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", color: "white", fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 9px", borderRadius: "100px" }}>
                                  {categoryLabel(post.category)}
                                </div>
                              )}
                            </div>
                            <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                              <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "8px" }}>{post.author_name || "Artist RADR"} · {date}</div>
                              <div style={{ fontFamily: F.d, fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3, marginBottom: "auto", color: "#111" }}
                                dangerouslySetInnerHTML={safeHtml(post.title, { inline: true })} />
                              <span className="bp-read-more" style={{ marginTop: "14px" }}>
                                Read more
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="bp-sidebar" style={{ position: "sticky", top: "100px" }}>

              {/* Recent */}
              <div style={{ background: "white", borderRadius: "16px", border: "0.5px solid rgba(0,0,0,0.07)", padding: "24px", marginBottom: "20px" }}>
                <div style={{ fontFamily: F.d, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#111", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "14px", borderRadius: "2px", background: "#D94F2B", display: "inline-block" }} />
                  Latest Posts
                </div>
                {posts.slice(0, 7).map((post) => {
                  const date = new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <Link to={`/blog/${post.slug}`} key={post.id} className="bp-recent-link">
                      <div style={{ width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", background: "#eeecea", flexShrink: 0 }}>
                        {post.cover_url && <img src={post.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 500, lineHeight: 1.4, color: "#111", marginBottom: "3px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                          dangerouslySetInnerHTML={safeHtml(post.title, { inline: true })} />
                        <div style={{ fontSize: "11px", color: "#bbb" }}>{date}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Submit CTA */}
              <div style={{ background: "#111", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden", marginBottom: "20px" }}>
                <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "130px", height: "130px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "10px" }}>Get Discovered</div>
                  <div style={{ fontFamily: F.d, fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.2, marginBottom: "10px" }}>Submit Your Track</div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "16px", fontWeight: 300 }}>Get your music in front of thousands of listeners and curators.</p>
                  <Link to="/submit-track" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#D94F2B", color: "white", padding: "10px 18px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(217,79,43,0.35)" }}>
                    Submit Now →
                  </Link>
                </div>
              </div>

              {/* Newsletter */}
              <div style={{ background: "white", borderRadius: "16px", border: "0.5px solid rgba(0,0,0,0.07)", padding: "24px" }}>
                <div style={{ fontFamily: F.d, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px", color: "#111" }}>Stay on the RADR</div>
                <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6, marginBottom: "14px", fontWeight: 300 }}>Get the latest drops and artist spotlights straight to your inbox.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input type="email" placeholder="your@email.com" style={{ padding: "10px 14px", border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: "8px", fontFamily: F.b, fontSize: "13px", color: "#111", background: "#fafafa", outline: "none" }} />
                  <button style={{ padding: "10px", background: "#D94F2B", border: "none", borderRadius: "8px", color: "white", fontFamily: F.b, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Subscribe</button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default BlogPage;
