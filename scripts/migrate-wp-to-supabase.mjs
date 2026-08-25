/**
 * migrate-wp-to-supabase.mjs
 *
 * Pulls all PUBLISHED posts from the live WordPress REST API at
 * artistradr.com, re-hosts the featured image (and any inline WP-hosted
 * content images) into the Supabase `post-covers` storage bucket, and
 * upserts each post into the `posts` table.
 *
 * Safe to re-run: upserts are keyed on `wp_id`, so running this again
 * updates existing rows instead of creating duplicates.
 *
 * PREREQUISITES
 *   1. Run 001_add_wp_import_columns.sql against your Supabase project first
 *      (adds posts.wp_id and posts.author_name — this script needs both).
 *   2. npm install @supabase/supabase-js dotenv
 *      (node-fetch not needed — Node 18+ has global fetch)
 *   3. Copy .env.migration.example -> .env.migration and fill in real values.
 *
 * USAGE
 *   node migrate-wp-to-supabase.mjs
 *   node migrate-wp-to-supabase.mjs --dry-run    (fetch + map, skip writes)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.migration" });

const WP_BASE_URL = (process.env.WP_BASE_URL || "https://artistradr.com").replace(/\/$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "post-covers";
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.migration — see .env.migration.example."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CATEGORY_ALIASES = {
  "new-release": ["new-release", "new-releases", "new release", "release", "releases"],
  "on-your-radr": ["on-your-radr", "on your radr", "radr", "featured"],
  "spotlights": ["spotlight", "spotlights", "artist-spotlight", "artist spotlight"],
  "playlist": ["playlist", "playlists"],
};

function mapCategory(wpCategoryTerms) {
  if (!wpCategoryTerms || wpCategoryTerms.length === 0) return null;
  for (const term of wpCategoryTerms) {
    const slug = (term.slug || "").toLowerCase();
    const name = (term.name || "").toLowerCase();
    for (const [ourValue, aliases] of Object.entries(CATEGORY_ALIASES)) {
      if (aliases.includes(slug) || aliases.includes(name)) return ourValue;
    }
  }
  return null;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extFromUrl(url) {
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "jpg";
}

async function fetchAllPublishedPosts() {
  const posts = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/posts?status=publish&per_page=50&page=${page}&_embed`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400 && page > 1) break;
      throw new Error(`WP REST API error ${res.status} fetching ${url}`);
    }
    totalPages = Number(res.headers.get("X-WP-TotalPages")) || 1;
    const batch = await res.json();
    posts.push(...batch);
    console.log(`  fetched page ${page}/${totalPages} (${batch.length} posts)`);
    page++;
  } while (page <= totalPages);

  return posts;
}

async function rehostImage(sourceUrl, storagePath) {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (DRY_RUN) {
      console.log(`    [dry-run] would upload ${storagePath} (${buffer.length} bytes)`);
      return `[dry-run]/${storagePath}`;
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    console.warn(`    ! failed to rehost ${sourceUrl}: ${err.message}`);
    return null;
  }
}

async function rehostInlineImages(html, wpId) {
  if (!html) return html;
  const wpHost = new URL(WP_BASE_URL).host;
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;
  const matches = [...html.matchAll(imgSrcRegex)];

  let result = html;
  let index = 0;
  for (const match of matches) {
    const originalSrc = match[1];
    let host;
    try {
      host = new URL(originalSrc).host;
    } catch {
      continue;
    }
    if (host !== wpHost) continue;

    index++;
    const ext = extFromUrl(originalSrc);
    const storagePath = `posts/${wpId}/content/${index}.${ext}`;
    const newUrl = await rehostImage(originalSrc, storagePath);
    if (newUrl) {
      result = result.split(originalSrc).join(newUrl);
    }
  }
  return result;
}

async function main() {
  console.log(`WordPress source: ${WP_BASE_URL}`);
  console.log(`Supabase target:  ${SUPABASE_URL}`);
  console.log(`Storage bucket:   ${STORAGE_BUCKET}`);
  if (DRY_RUN) console.log("*** DRY RUN — no writes will be made ***");
  console.log("");

  console.log("Fetching published posts from WordPress...");
  const wpPosts = await fetchAllPublishedPosts();
  console.log(`Found ${wpPosts.length} published posts.\n`);

  let migrated = 0;
  let failed = 0;

  for (const post of wpPosts) {
    const wpId = post.id;
    const slug = post.slug;
    console.log(`[${wpId}] ${slug}`);

    try {
      let coverUrl = null;
      const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
      if (featuredMedia?.source_url) {
        const ext = extFromUrl(featuredMedia.source_url);
        coverUrl = await rehostImage(featuredMedia.source_url, `posts/${wpId}/cover.${ext}`);
      }

      const rehostedContent = await rehostInlineImages(post.content?.rendered, wpId);

      const authorName = post._embedded?.author?.[0]?.name || null;
      const categoryTerms = (post._embedded?.["wp:term"]?.[0] || []).map((t) => ({
        slug: t.slug,
        name: t.name,
      }));

      const row = {
        wp_id: wpId,
        title: post.title?.rendered || "(untitled)",
        slug,
        content: rehostedContent || "",
        excerpt: stripHtml(post.excerpt?.rendered),
        cover_url: coverUrl,
        category: mapCategory(categoryTerms),
        author_name: authorName,
        published_at: post.date_gmt ? `${post.date_gmt}Z` : post.date,
        status: "published",
      };

      if (DRY_RUN) {
        console.log(`  [dry-run] would upsert:`, {
          ...row,
          content: `(${row.content.length} chars)`,
        });
      } else {
        const { error } = await supabase.from("posts").upsert(row, { onConflict: "wp_id" });
        if (error) throw error;
        console.log(`  ✓ upserted (category: ${row.category || "none"}, cover: ${coverUrl ? "yes" : "no"})`);
      }

      migrated++;
    } catch (err) {
      console.error(`  ✗ failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${migrated} migrated, ${failed} failed, ${wpPosts.length} total.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
