import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../../supabaseClient"; // NOTE: one level deeper than the old flat file — verify this path
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";

import "./styles.css";
import { stripHtml } from "./utils";
import { BackArrowIcon } from "./components/icons";
import PostHeader from "./components/PostHeader";
import CoverImage from "./components/CoverImage";
import ShareMenu from "./components/ShareMenu";
import ArticleSidebar from "./components/ArticleSidebar";

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
              <div className="bp-article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

              <div className="bp-article-actions">
                <Link to="/blog" className="bp-pill">
                  ← More Articles
                </Link>
                <ShareMenu url={shareUrl} title={plainTitle} />
              </div>
            </article>

            <ArticleSidebar recentPosts={recentPosts} currentSlug={slug} />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;