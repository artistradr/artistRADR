import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient"; // ⚠️ adjust to match your folder depth (see BlogPost.jsx for pattern)

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeEditorial() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("HomeEditorial fetch error:", error);
          setPosts([]);
        } else {
          setPosts(data || []);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const featured = posts[0] || null;
  const secondary = posts.slice(1, 3);
  const rest = posts.slice(3, 6);

  const fmtLong = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const fmtShort = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const excerptText = (post, len) => {
    const src = post.excerpt || (post.content || "").replace(/<[^>]+>/g, "");
    return src.slice(0, len) + (src.length > len ? "…" : "");
  };

  return (
    <>
      <style>{`
        .h-section-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #D94F2B; margin-bottom: 8px; }
        .h-section-title { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #111; margin: 0; line-height: 1.1; }
        .h-blog-featured {
          display: grid; grid-template-columns: 1.2fr 1fr;
          background: white; border-radius: 20px;
          border: 0.5px solid rgba(0,0,0,0.07); overflow: hidden;
          text-decoration: none; color: #111; margin-bottom: 24px;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .h-blog-featured:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.10); }
        .h-blog-featured:hover .h-read-more { color: #D94F2B; }
        .h-card {
          background: white; border-radius: 16px; border: 0.5px solid rgba(0,0,0,0.07);
          overflow: hidden; text-decoration: none; color: #111;
          display: flex; flex-direction: column;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .h-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.09); }
        .h-card:hover .h-read-more { color: #D94F2B; }
        .h-read-more { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #aaa; transition: color 150ms ease; }
        .h-read-more svg { transition: transform 150ms ease; }
        .h-card:hover .h-read-more svg,
        .h-blog-featured:hover .h-read-more svg { transform: translateX(3px); }
        .h-skeleton { background: #eeecea; border-radius: 16px; animation: pulse 1.5s ease infinite alternate; }
        @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
        @media (max-width: 900px) {
          .h-blog-featured { grid-template-columns: 1fr; }
          .h-blog-featured-img { height: 240px !important; }
        }
        @media (max-width: 600px) {
          .h-blog-grid { grid-template-columns: 1fr !important; }
          .h-blog-secondary { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section style={{ padding: "80px 0 100px", background: "#f7f6f3" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div className="h-section-label">Editorial</div>
              <h2 className="h-section-title">Latest from the Blog</h2>
            </div>
            <Link to="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#D94F2B", textDecoration: "none", padding: "9px 18px", borderRadius: "100px", background: "rgba(217,79,43,0.07)", border: "0.5px solid rgba(217,79,43,0.2)" }}>
              View all articles
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "20px" }}>
              {[1,2,3,4].map((i) => <div key={i} className="h-skeleton" style={{ height: "300px" }} />)}
            </div>
          ) : !featured ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>
              No published posts yet.
            </div>
          ) : (
            <>
              <Link to={`/blog/${featured.slug}`} className="h-blog-featured">
                <div className="h-blog-featured-img" style={{ height: "400px", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  {featured.cover_url
                    ? <img src={featured.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", background: "#eeecea" }} />
                  }
                  <div style={{ position: "absolute", top: "16px", left: "16px", background: "#D94F2B", color: "white", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "4px 12px", borderRadius: "100px" }}>Featured</div>
                </div>
                <div style={{ padding: "36px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "14px" }}>
                      {featured.author_name || "Artist RADR"} · {fmtLong(featured.published_at)}
                    </div>
                    <div style={{ fontFamily: F.d, fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1.15, color: "#111", marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: featured.title }} />
                    <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.75, fontWeight: 300 }}>
                      {excerptText(featured, 180)}
                    </div>
                  </div>
                  <span className="h-read-more" style={{ marginTop: "28px" }}>
                    Read full article
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </span>
                </div>
              </Link>

              {secondary.length > 0 && (
                <div className="h-blog-secondary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {secondary.map((post) => (
                    <Link to={`/blog/${post.slug}`} key={post.id} className="h-card">
                      <div style={{ position: "relative", overflow: "hidden" }}>
                        {post.cover_url ? <img src={post.cover_url} alt="" style={{ width: "100%", height: "210px", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "210px", background: "#eeecea" }} />}
                        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "white", fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px" }}>
                          {post.category || "Editorial"}
                        </div>
                      </div>
                      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "8px" }}>{fmtShort(post.published_at)}</div>
                        <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3, marginBottom: "auto", color: "#111" }} dangerouslySetInnerHTML={{ __html: post.title }} />
                        <span className="h-read-more" style={{ marginTop: "14px" }}>
                          Read more
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <div className="h-blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                  {rest.map((post) => (
                    <Link to={`/blog/${post.slug}`} key={post.id} className="h-card">
                      {post.cover_url ? <img src={post.cover_url} alt="" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "160px", background: "#eeecea" }} />}
                      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "10px", color: "#bbb", marginBottom: "7px" }}>{fmtShort(post.published_at)}</div>
                        <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3, marginBottom: "auto", color: "#111" }} dangerouslySetInnerHTML={{ __html: post.title }} />
                        <span className="h-read-more" style={{ marginTop: "12px", fontSize: "11px" }}>
                          Read more
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default HomeEditorial;