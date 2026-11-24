// scripts/generate-post-html.mjs
//
// Generates a real, static HTML file per blog post — with correct
// og:*/twitter:* meta tags already baked in — right after `vite build`
// finishes. This is the right fix for a "build, then upload to static
// hosting" workflow: there's no server process to run in production at
// all, so a live request-time server (Express, serverless function,
// etc.) isn't an option. Instead we do the work once, at build time, on
// your own machine, and just upload the extra files alongside everything
// else you already upload.
//
// WHY THIS FIXES THE SHARE-PREVIEW BUG
// -------------------------------------
// Facebook/X/WhatsApp/LinkedIn crawlers don't run JavaScript — they read
// whatever <meta> tags exist in the raw HTML file at that exact URL.
// Previously every route (including every /blog/:slug) served the exact
// same dist/index.html, so every share preview showed your homepage's
// tags. This script writes a SEPARATE, real file for each post at
// dist/blog/<slug>/index.html, with THAT post's title/description/image
// swapped in — while keeping the same JS/CSS bundle references, so real
// visitors landing there still get your fully working React app; only
// the <head> metadata differs per post.
//
// HOW IT RUNS
// -----------
// Add this to package.json's "scripts" (see note below the code) so it
// runs automatically every time you do `npm run build` — no change to
// your existing build → upload workflow.
//
// URL SHAPE NOTE
// ---------------
// This writes dist/blog/<slug>/index.html (a folder per post, not a
// dist/blog/<slug>.html file). Most static/shared hosts (Apache/cPanel
// especially) automatically serve a directory's index.html when that
// directory is requested, and will also auto-redirect a request WITHOUT
// a trailing slash (e.g. /blog/my-post) to the version WITH one
// (/blog/my-post/) — which then finds this file. If your specific host
// does NOT do that (some plain nginx configs won't without extra
// config), tell me and I'll switch this script to instead flatten each
// post to dist/blog/<slug>.html and show you the small nginx/host config
// tweak needed to match.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config"; // reads VITE_SUPABASE_PUBLISHABLE_KEY from .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist lives one level up from /scripts
const DIST_DIR = path.join(__dirname, "..", "dist");

// Anon keys are public/client-safe by design (the same key already ships
// inside your bundled JS), so hardcoded fallbacks here are fine — but
// env vars still override them if you ever rotate keys or reuse this
// script for a staging project.
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://rjivkemajotafjvtalol.supabase.co";
// Public (browser-safe) key: the new sb_publishable_... key, or the legacy anon key.
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) {
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY (set it in .env) for generate-post-html.");
}
const SITE_URL = (process.env.SITE_URL || "https://artistradr.com").replace(/\/$/, "");

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

async function fetchPublishedPosts() {
  const url = `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=*`;
  const res = await fetch(url, {
    // New publishable keys (sb_publishable_...) are not JWTs and go in "apikey" only.
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(SUPABASE_ANON_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Strips any existing <title>, <meta name="description">,
// <meta property="og:*">, and <meta name="twitter:*"> tags from the
// template's <head>, then injects the post-specific ones right before
// </head>. Works regardless of exactly what SEOHead/index.html currently
// contain — it targets tags by attribute, not by exact string match.
function injectPostMeta(templateHtml, post, slug) {
  let html = templateHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(/<meta\s+name=["']description["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, "");
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "");

  const title = stripHtml(post.title) || "Artist RADR";
  const description =
    stripHtml(post.excerpt) || stripHtml(post.content).slice(0, 160) || "Let your voice echo with Artist RADR.";
  const image = absoluteUrl(post.cover_url) || `${SITE_URL}/og-default.jpg`;
  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const author = post.author_name || "Artist RADR";

  const tags = `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description.slice(0, 200))}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:site_name" content="Artist RADR" />
  ${post.published_at ? `<meta property="article:published_time" content="${escapeHtml(post.published_at)}" />` : ""}
  <meta property="article:author" content="${escapeHtml(author)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 200))}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>`;

  html = html.replace(/<\/head>/i, tags);
  return html;
}

async function main() {
  const indexPath = path.join(DIST_DIR, "index.html");
  let template;
  try {
    template = await fs.readFile(indexPath, "utf-8");
  } catch {
    console.error(
      `[generate-post-html] Could not find ${indexPath}. Run \`vite build\` first.`
    );
    process.exit(1);
  }

  let posts;
  try {
    posts = await fetchPublishedPosts();
  } catch (err) {
    console.error("[generate-post-html] Failed to fetch posts from Supabase:", err.message);
    console.error("[generate-post-html] Skipping — dist/index.html will still work as the SPA fallback.");
    return;
  }

  if (!posts.length) {
    console.log("[generate-post-html] No published posts found — nothing to generate.");
    return;
  }

  let written = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    const outDir = path.join(DIST_DIR, "blog", post.slug);
    const outFile = path.join(outDir, "index.html");
    const html = injectPostMeta(template, post, post.slug);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, html, "utf-8");
    written++;
  }

  console.log(`[generate-post-html] Wrote ${written} static post page(s) into dist/blog/<slug>/index.html`);
}

main();