// server.js  (ESM — matches this project's "type": "module" in package.json)
//
// Serves the built React app AND fixes social link previews.
//
// THE PROBLEM
// -----------
// Facebook/X/WhatsApp/LinkedIn/etc. crawlers do NOT execute JavaScript.
// They fetch a URL once and read whatever <meta> tags are already present
// in that raw HTML response. Your SEOHead component only sets og:title /
// og:image / og:description AFTER React mounts in a real browser — so
// every route (including every /blog/:slug post) serves the exact same
// static index.html with the exact same default (homepage) meta tags.
// That's why sharing a post link previews your homepage instead of the
// post.
//
// THE FIX
// -------
// This server sits in front of the SPA. For normal visitors it serves
// index.html/static assets unchanged — React Router still works exactly
// as before. But when the incoming request's User-Agent matches a known
// social-media crawler AND the path is /blog/:slug, it fetches that post
// from Supabase and returns a minimal HTML document with the correct
// og:*/twitter:* tags already inlined. The crawler never runs JS, so
// this is the only way to give it real per-post metadata.
//
// HOW TO RUN
// ----------
//   1. npm install express        (that's the only package needed — Node 22
//                                   has fetch built in globally, no node-fetch
//                                   package required)
//   2. Build the SPA:              npm run build
//   3. Confirm your build output folder (see BUILD_DIR below — CRA uses
//      "build", Vite uses "dist") and adjust if needed.
//   4. Set env vars (see below), then:  node server.js
//   5. To actually TEST previews (not just load this server), you need a
//      public URL — crawlers cannot reach localhost. Use a tunnel:
//          npx ngrok http 3000
//      then paste the ngrok https URL into:
//        - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
//        - Twitter/X Card Validator:  https://cards-dev.twitter.com/validator
//        - LinkedIn Post Inspector:   https://www.linkedin.com/post-inspector/
//      (WhatsApp has no public debugger and caches aggressively — test with
//      a fresh URL, e.g. add "?v=1", rather than re-sending an already-shared link.)
//
// ENV VARS REQUIRED
// ------------------
//   SUPABASE_URL        — same URL used in supabaseClient.js
//   SUPABASE_ANON_KEY    — same anon/public key used in supabaseClient.js
//   SITE_URL             — e.g. https://artistradr.com
//   PORT                 — optional, defaults to 3000
//
// Once you know your production host (Netlify/Vercel/etc.), the same
// crawler-detection + Supabase-fetch logic below can be ported into that
// platform's Edge/Serverless Function — the core logic doesn't change,
// only how the function is wired up to receive the request.

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SITE_URL = (process.env.SITE_URL || "https://artistradr.com").replace(/\/$/, "");

// This project builds with Vite, which outputs to "dist".
const BUILD_DIR = path.join(__dirname, "dist");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[server] WARNING: SUPABASE_URL / SUPABASE_ANON_KEY are not set. " +
    "Crawler requests to /blog/:slug will fall back to generic metadata."
  );
}

// Matches the user-agent strings sent by known link-preview crawlers.
const CRAWLER_UA_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|Google-InspectionTool|Pinterest|redditbot|Applebot/i;

function isCrawler(req) {
  const ua = req.get("user-agent") || "";
  return CRAWLER_UA_REGEX.test(ua);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").trim();
}

function absoluteUrl(maybeRelative) {
  if (!maybeRelative) return null;
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  return `${SITE_URL}/${String(maybeRelative).replace(/^\//, "")}`;
}

async function fetchPostBySlug(slug) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const url =
    `${SUPABASE_URL}/rest/v1/posts` +
    `?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`;
  const res = await fetch(url, {
    // New publishable keys (sb_publishable_...) are not JWTs and go in "apikey" only.
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(SUPABASE_ANON_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows && rows[0] ? rows[0] : null;
}

// Renders the tiny crawler-only HTML document with correct per-post tags.
function renderCrawlerHtml(post, slug) {
  const title = post ? stripHtml(post.title) : "Artist RADR";
  const description = post
    ? (stripHtml(post.excerpt) || stripHtml(post.content).slice(0, 160))
    : "Let your voice echo with Artist RADR.";
  const image = post ? absoluteUrl(post.cover_url) : `${SITE_URL}/og-default.jpg`;
  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const author = post?.author_name || "Artist RADR";
  const publishedTime = post?.published_at || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description.slice(0, 160))}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />

<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description.slice(0, 200))}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:site_name" content="Artist RADR" />
${publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : ""}
${author ? `<meta property="article:author" content="${escapeHtml(author)}" />` : ""}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description.slice(0, 200))}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(pageUrl)}">Read the full post</a>
</body>
</html>`;
}

// Intercept ONLY crawler requests to /blog/:slug — everything else (real
// users, all other routes) falls through to the normal static SPA below,
// completely untouched.
app.get("/blog/:slug", async (req, res, next) => {
  if (!isCrawler(req)) return next();

  try {
    const post = await fetchPostBySlug(req.params.slug);
    res.set("Cache-Control", "public, max-age=300"); // 5 min — crawlers re-fetch often
    return res.status(200).send(renderCrawlerHtml(post, req.params.slug));
  } catch (err) {
    console.error("[server] crawler metadata fetch failed:", err);
    return res.status(200).send(renderCrawlerHtml(null, req.params.slug));
  }
});

// Normal SPA serving for everyone else.
app.use(express.static(BUILD_DIR));

// React Router fallback — must come after the static middleware and the
// crawler route above. Using app.use() with no path pattern (rather than
// app.get("*", ...)) matches every remaining request without going
// through path-to-regexp's wildcard parsing — Express 5's updated
// path-to-regexp (v7+) no longer accepts a bare "*" there.
app.use((req, res) => {
  res.sendFile(path.join(BUILD_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] SITE_URL = ${SITE_URL}`);
  console.log(
    "[server] Reminder: crawlers can't reach localhost. Use `npx ngrok http " +
    PORT +
    "` and test the ngrok URL in Facebook's Sharing Debugger."
  );
});