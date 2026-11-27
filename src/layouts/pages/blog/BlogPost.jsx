import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { safeHtml } from "../../../utils/sanitizeHtml";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";

import "./BlogPost/components/blogPost.css";
import { stripHtml, formatLongDate, formatShortDate, estimateReadMinutes, buildShareLinks } from "./BlogPost/components/blogPost.utils";

/* ────────────────────────────────────────────────────────────
   Small inline icons — not reused anywhere else, so they live
   right here instead of a separate icons file.
   ──────────────────────────────────────────────────────────── */
const BackArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.4 22h-7.1l-5.5-7.2L4.5 22H1.4l8.2-9.3L1 2h7.3l5 6.6L18.9 2Zm-1.2 18h1.9L7.4 4h-2l12.3 16Z" /></svg>
);
const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7C16.4 3.66 15.4 3.58 14.24 3.58c-2.4 0-4.04 1.47-4.04 4.16V9.9H7.5V13h2.7v8h3.3Z" /></svg>
);
const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.1a9.9 9.9 0 0 0-8.5 15L2 22l5.1-1.3a9.9 9.9 0 0 0 4.9 1.3h0a9.9 9.9 0 0 0 0-19.8Zm0 18a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.5 1.1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" /></svg>
);
const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.9-2.1 3.9-2.1 4.2 0 5 2.8 5 6.3V21h-4v-5.4c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21h-4V9Z" /></svg>
);
const EmailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
);
const LinkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);

/* ────────────────────────────────────────────────────────────
   Title + author/date/read-time
   ──────────────────────────────────────────────────────────── */
const PostHeader = ({ post, author }) => (
  <>
    <h1 className="bp-title" dangerouslySetInnerHTML={safeHtml(post.title, { inline: true })} />
    <div className="bp-meta-row">
      <div className="bp-avatar">{author[0]}</div>
      <div>
        <div className="bp-author-name">{author}</div>
        <div className="bp-author-date">{formatLongDate(post.published_at)}</div>
      </div>
      <div className="bp-meta-divider" />
      <div className="bp-read-time">{estimateReadMinutes(post.content)} min read</div>
    </div>
  </>
);

/* ────────────────────────────────────────────────────────────
   Cover image — desktop blurred-backdrop vs. mobile natural
   ──────────────────────────────────────────────────────────── */
const CoverImage = ({ src, alt }) => {
  if (!src) return null;
  return (
    <>
      <div className="bp-cover-desktop bp-cover">
        <img src={src} alt="" aria-hidden="true" className="bp-cover-backdrop" />
        <img src={src} alt={alt} className="bp-cover-fg" />
      </div>
      <div className="bp-cover-mobile bp-cover-mobile-wrap">
        <img src={src} alt={alt} className="bp-cover-mobile-img" />
      </div>
    </>
  );
};

/* ────────────────────────────────────────────────────────────
   Share button + dropdown (real platform links + copy link)
   ──────────────────────────────────────────────────────────── */
const ShareMenu = ({ url, title }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const links = buildShareLinks(url, title);
  const targets = [
    { name: "X", href: links.x, icon: <XIcon /> },
    { name: "Facebook", href: links.facebook, icon: <FacebookIcon /> },
    { name: "WhatsApp", href: links.whatsapp, icon: <WhatsAppIcon /> },
    { name: "LinkedIn", href: links.linkedin, icon: <LinkedInIcon /> },
    { name: "Email", href: links.email, icon: <EmailIcon /> },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={menuRef} className="bp-share-wrap">
      <button type="button" className="bp-pill" onClick={() => setOpen((v) => !v)}>
        Share
      </button>

      {open && (
        <div className="bp-share-dropdown">
          {targets.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bp-share-item"
              onClick={() => setOpen(false)}
            >
              <span className="bp-share-icon">{t.icon}</span>
              {t.name}
            </a>
          ))}
          <div className="bp-share-divider" />
          <button type="button" className="bp-share-item bp-share-item--btn" onClick={handleCopyLink}>
            <span className="bp-share-icon"><LinkIcon /></span>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Sidebar: recent posts + submit CTA
   ──────────────────────────────────────────────────────────── */
const Sidebar = ({ recentPosts, currentSlug }) => (
  <aside className="bp-sidebar">
    <div className="bp-card">
      <div className="bp-card-title">
        <span className="bp-card-title-bar" />
        Recent Posts
      </div>
      {recentPosts
        .filter((r) => r.slug !== currentSlug)
        .slice(0, 5)
        .map((recent) => (
          <Link to={`/blog/${recent.slug}`} key={recent.id} className="bp-recent-link">
            <div className="bp-recent-thumb">
              {recent.cover_url && <img src={recent.cover_url} alt="" />}
            </div>
            <div className="bp-recent-info">
              <div className="bp-recent-title" dangerouslySetInnerHTML={safeHtml(recent.title, { inline: true })} />
              <div className="bp-recent-date">{formatShortDate(recent.published_at)}</div>
            </div>
          </Link>
        ))}
    </div>

    <div className="bp-cta-card">
      <div className="bp-cta-glow" />
      <div className="bp-cta-content">
        <div className="bp-cta-eyebrow">Get on the RADR</div>
        <div className="bp-cta-title">Submit Your Track</div>
        <p className="bp-cta-copy">Get your music in front of thousands of listeners.</p>
        <Link to="/submit-track" className="bp-cta-button">Submit Now →</Link>
      </div>
    </div>
  </aside>
);

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */
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
  if (loading) {
    return (
      <div className="bp-loading-wrap">
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />
        <div className="bp-loading-center">
          <div className="bp-spinner-wrap">
            <div className="bp-spinner" />
            <span className="bp-loading-label">Loading article…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!post) {
    return (
      <div className="bp-notfound-wrap">
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />
        <div className="bp-notfound-center">
          <p className="bp-notfound-text">Post not found.</p>
          <Link to="/blog" className="bp-notfound-link">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const featuredImage = post.cover_url || "";
  const author = post.author_name || "Artist RADR";
  const plainTitle = stripHtml(post.title) || "Blog Post";
  const plainExcerpt = stripHtml(post.excerpt) || stripHtml(post.content).slice(0, 160);
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://artistradr.com/blog/${post.slug}`;

  return (
    <>
      <SEOHead
        title={plainTitle}
        description={plainExcerpt.slice(0, 160)}
        path={`/blog/${post.slug}`}
        image={featuredImage}
        type="article"
        publishedTime={post.published_at}
        author={author}
      />

      <div className="bp-page">
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        <div className="bp-wrapper">
          <Link to="/blog" className="bp-back-link">
            <BackArrowIcon />
            Back to Blog
          </Link>

          <PostHeader post={post} author={author} />
          <CoverImage src={featuredImage} alt={plainTitle} />

          <div className="bp-layout">
            <article>
              <div className="bp-article-body" dangerouslySetInnerHTML={safeHtml(post.content)} />

              <div className="bp-article-actions">
                <Link to="/blog" className="bp-pill">← More Articles</Link>
                <ShareMenu url={shareUrl} title={plainTitle} />
              </div>
            </article>

            <Sidebar recentPosts={recentPosts} currentSlug={slug} />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
