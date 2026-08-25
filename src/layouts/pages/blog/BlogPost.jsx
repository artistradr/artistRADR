import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setPost(data || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        setRecentPosts(data || []);
      });
  }, []);

  // ── Loading state ──
  if (loading) return (
    <div style={{ fontFamily: F.b, minHeight: "100vh", background: "#f7f6f3", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2.5px solid #D94F2B", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "13px", color: "#aaa" }}>Loading article…</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Not found ──
  if (!post) return (
    <div style={{ fontFamily: F.b, minHeight: "100vh", background: "#f7f6f3", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <p style={{ color: "#aaa", fontSize: "14px" }}>Post not found.</p>
        <Link to="/blog" style={{ fontSize: "13px", fontWeight: 600, color: "#D94F2B", textDecoration: "none" }}>← Back to Blog</Link>
      </div>
    </div>
  );

  const featuredImage = post.cover_url || "";
  const author = post.author_name || "Artist RADR";
  const date = new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // ── Strip HTML for SEO title/description ──
  const plainTitle = post.title?.replace(/<[^>]+>/g, "") || "Blog Post";
  const plainExcerpt = post.excerpt?.replace(/<[^>]+>/g, "") || post.content?.replace(/<[^>]+>/g, "")?.slice(0, 160) || "";

  return (
    <>
      {/* ── SEOHead ── */}
      <SEOHead
        title={plainTitle}
        description={plainExcerpt.slice(0, 160)}
        path={`/blog/${post.slug}`}
        image={featuredImage}
        type="article"
        publishedTime={post.published_at}
        author={author}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .bp-article-body h2 {
          font-family: var(--font-display);
          font-size: 1.5rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: #111; margin: 2.2rem 0 0.8rem;
        }
        .bp-article-body h3 {
          font-family: var(--font-display);
          font-size: 1.15rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: #111; margin: 1.8rem 0 0.6rem;
        }
        .bp-article-body p {
          font-size: 16px; line-height: 1.85; color: #333;
          font-weight: 300; margin-bottom: 1.4rem;
        }
        .bp-article-body img {
          width: 100%; border-radius: 12px; margin: 1.5rem 0; display: block;
        }
        .bp-article-body a { color: #D94F2B; text-underline-offset: 3px; }
        .bp-article-body blockquote {
          border-left: 3px solid #D94F2B;
          margin: 2rem 0; padding: 4px 0 4px 20px;
          font-style: italic; color: #666; font-size: 1.05rem; line-height: 1.7;
        }
        .bp-article-body ul, .bp-article-body ol {
          padding-left: 1.4rem; margin-bottom: 1.4rem;
        }
        .bp-article-body li { font-size: 15px; line-height: 1.75; color: #333; margin-bottom: 6px; font-weight: 300; }
        .bp-article-body strong { font-weight: 600; color: #111; }

        .bp-recent-link { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #111; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 0.5px solid rgba(0,0,0,0.06); transition: opacity 150ms ease; }
        .bp-recent-link:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
        .bp-recent-link:hover { opacity: 0.75; }

        .bp-cover-mobile { display: none; }
        .bp-cover-desktop { display: block; }

        @media (max-width: 860px) {
          .bp-layout { grid-template-columns: 1fr !important; }
          .bp-sidebar { position: static !important; }
        }
        @media (max-width: 700px) {
          .bp-cover-desktop { display: none; }
          .bp-cover-mobile { display: block; }
        }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        {/* ── Page wrapper — matches nav width ── */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "100px 1.5rem 0" }}>

          {/* ── Back link ── */}
          <Link to="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#aaa", textDecoration: "none", marginBottom: "28px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Blog
          </Link>

          {/* ── Title ── */}
          <h1
            style={{ fontFamily: F.d, fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", lineHeight: 1.05, color: "#111", marginBottom: "20px", maxWidth: "820px" }}
            dangerouslySetInnerHTML={{ __html: post.title }}
          />

          {/* ── Author + date row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#D94F2B", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 700 }}>{author[0]}</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{author}</div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>{date}</div>
            </div>
            <div style={{ width: "1px", height: "28px", background: "rgba(0,0,0,0.1)", margin: "0 4px" }} />
            <div style={{ fontSize: "11px", color: "#aaa", fontWeight: 500 }}>
              {Math.ceil((post.content?.replace(/<[^>]+>/g, "")?.split(" ")?.length || 0) / 200)} min read
            </div>
          </div>

          {/* ── Cover image ── */}
          {featuredImage && (
            <>
              {/* Desktop — blurred backdrop, no black bars */}
              <div className="bp-cover-desktop" style={{ width: "100%", height: "480px", borderRadius: "16px", overflow: "hidden", marginBottom: "48px", position: "relative" }}>
                <img src={featuredImage} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.55) saturate(1.4)", transform: "scale(1.08)", display: "block" }} />
                <img src={featuredImage} alt={plainTitle} style={{ position: "relative", zIndex: 1, display: "block", margin: "0 auto", height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }} />
              </div>
              {/* Mobile — full width, natural portrait height, no cropping */}
              <div className="bp-cover-mobile" style={{ width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "32px" }}>
                <img src={featuredImage} alt={plainTitle} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </>
          )}

          {/* ── Two column layout ── */}
          <div className="bp-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "56px", alignItems: "start", paddingBottom: "100px" }}>

            {/* Article */}
            <article>
              <div
                className="bp-article-body"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags / share strip */}
              <div style={{ marginTop: "48px", paddingTop: "28px", borderTop: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <Link to="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#D94F2B", textDecoration: "none", padding: "9px 18px", borderRadius: "100px", background: "rgba(217,79,43,0.07)", border: "0.5px solid rgba(217,79,43,0.2)" }}>
                  ← More Articles
                </Link>
                <div style={{ fontSize: "12px", color: "#aaa" }}>Share this article</div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="bp-sidebar" style={{ position: "sticky", top: "100px" }}>

              {/* Recent posts */}
              <div style={{ background: "white", borderRadius: "16px", border: "0.5px solid rgba(0,0,0,0.07)", padding: "24px", marginBottom: "20px" }}>
                <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#111", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "14px", borderRadius: "2px", background: "#D94F2B", display: "inline-block" }} />
                  Recent Posts
                </div>
                {recentPosts.filter((r) => r.slug !== slug).slice(0, 5).map((recent) => {
                  const rDate = new Date(recent.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <Link to={`/blog/${recent.slug}`} key={recent.id} className="bp-recent-link">
                      <div style={{ flexShrink: 0, width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "#eeecea" }}>
                        {recent.cover_url && <img src={recent.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: F.b, fontSize: "12.5px", fontWeight: 500, lineHeight: 1.4, color: "#111", marginBottom: "3px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} dangerouslySetInnerHTML={{ __html: recent.title }} />
                        <div style={{ fontSize: "11px", color: "#bbb" }}>{rDate}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* CTA card */}
              <div style={{ background: "#111", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "10px" }}>Get on the RADR</div>
                  <div style={{ fontFamily: F.d, fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.2, marginBottom: "12px" }}>Submit Your Track</div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "16px", fontWeight: 300 }}>Get your music in front of thousands of listeners.</p>
                  <Link to="/submit-track" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#D94F2B", color: "white", padding: "10px 18px", borderRadius: "8px", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, textDecoration: "none" }}>
                    Submit Now →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;