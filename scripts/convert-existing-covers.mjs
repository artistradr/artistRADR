// scripts/convert-existing-covers.mjs
//
// One-off migration: converts every existing post cover image that
// isn't already a JPEG into a JPEG, re-uploads it to the same Supabase
// storage path, and updates the post's cover_url. Run this ONCE to fix
// the covers on posts published before the upload pipeline started
// converting to JPEG automatically.
//
// WHY: Facebook's/X's link-preview crawlers don't reliably support
// WebP for og:image/twitter:image, even though it displays fine on the
// live site. Posts with a WebP cover show correct title/description in
// share previews but the image itself silently fails to render.
//
// SETUP (one-time)
// -----------------
//   npm install sharp
//
// You also need your Supabase SERVICE ROLE key for this script — NOT
// the anon key. The service role key bypasses Row Level Security so
// this script can overwrite storage objects and update rows regardless
// of your bucket/table policies.
//
//   Find it at: Supabase Dashboard → Project Settings → API →
//               "service_role" (secret) key
//
// ⚠️  This key has full admin access to your project. Never commit it,
// never put it in client-side code, never share it. Only ever use it
// as a one-off env var for scripts like this one that you run locally.
//
// RUN
// ---
//   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node scripts/convert-existing-covers.mjs
//
// After this finishes, run `npm run build` again so the static post
// pages (dist/blog/<slug>/index.html) pick up the new JPEG cover URLs,
// then re-upload dist/ to your host.

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://rjivkemajotafjvtalol.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error(
    "[convert-existing-covers] Missing SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Find it at: Supabase Dashboard → Project Settings → API → 'service_role' key.\n" +
    "Run again as:\n" +
    "  SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/convert-existing-covers.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, slug, cover_url")
    .not("cover_url", "is", null);

  if (error) {
    console.error("[convert-existing-covers] Failed to fetch posts:", error.message);
    process.exit(1);
  }

  console.log(`[convert-existing-covers] Found ${posts.length} post(s) with a cover image.\n`);

  let converted = 0, skipped = 0, failed = 0;

  for (const post of posts) {
    const label = post.slug || post.id;
    try {
      const res = await fetch(post.cover_url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        console.log(`SKIP    ${label} — already JPEG`);
        skipped++;
        continue;
      }

      const inputBuffer = Buffer.from(await res.arrayBuffer());
      // Flatten onto white first — source may have transparency (WebP/PNG),
      // and JPEG has no alpha channel.
      const jpegBuffer = await sharp(inputBuffer)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 85 })
        .toBuffer();

      const storagePath = `posts/${post.id}/cover`;
      const { error: uploadError } = await supabase.storage
        .from("post-covers")
        .upload(storagePath, jpegBuffer, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("post-covers").getPublicUrl(storagePath);
      const newCoverUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("posts")
        .update({ cover_url: newCoverUrl })
        .eq("id", post.id);
      if (updateError) throw updateError;

      console.log(`OK      ${label} — converted to JPEG`);
      converted++;
    } catch (err) {
      console.error(`FAILED  ${label} —`, err.message);
      failed++;
    }
  }

  console.log(
    `\n[convert-existing-covers] Done. Converted: ${converted}  Skipped (already JPEG): ${skipped}  Failed: ${failed}`
  );
  if (converted > 0) {
    console.log(
      "\nNext: run `npm run build` again so the static post pages pick up the new " +
      "JPEG cover URLs, then re-upload dist/ to your host."
    );
  }
}

main();