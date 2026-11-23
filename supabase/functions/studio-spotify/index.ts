// Edge Function: r2-video
// Resumable multipart uploads of music videos to Cloudflare R2 (same bucket + secrets as r2-audio).
// Actions (POST JSON), all authenticated with the caller's Supabase JWT:
//   init          { video_id, owner_id?, file_name, size }  -> { key, uploadId, partSize, partCount }
//   part-urls     { key, upload_id, part_numbers[] }        -> { urls: { [n]: presignedPutUrl } }
//   list-parts    { key, upload_id }                        -> { parts: [{partNumber,etag,size}] } | { expired:true }
//   complete      { key, upload_id, parts[{partNumber,etag}], video_id, file_name }
//                   -> assembles the object, writes video_releases (path/size/spec fields), kicks off analysis
//   abort         { key, upload_id }
//   download-url  { video_id }                              -> { url }   (preview player / admin)
//   delete        { key }                                   -> removes the object + clears the row
// Access: public.can_access_video_path() (owner folder OR accepted delegate; staff may read).
// Key layout (enforced by the DB guard too): {ownerId}/videos/{videoId}/{safeName}
// R2 bucket CORS must allow PUT from the app origin and EXPOSE the ETag header.

import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_BUCKET = Deno.env.get("R2_BUCKET")!;
const ANALYZER_URL = Deno.env.get("VIDEO_ANALYZER_URL") ?? "";
const ANALYZER_SECRET = Deno.env.get("VIDEO_ANALYZER_SECRET") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://dashboard.freerepublick.com,http://localhost:5173").split(",").map((s) => s.trim());

const GIB = 1024 * 1024 * 1024;
const MIB = 1024 * 1024;
const MAX_BYTES = 20 * GIB;
const BASE_PART = 64 * MIB;      // R2/S3: parts 5 MiB..5 GiB, max 10,000 parts
const MAX_PARTS = 10000;
const PART_URL_TTL = 6 * 3600;
const GET_TTL = 3600;
const ANALYZER_GET_TTL = 4 * 3600;
const ALLOWED_EXT = ["mov", "mp4"];
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const KEY_RE = new RegExp(`^(${UUID})/videos/(${UUID})/[A-Za-z0-9._-]{1,200}$`, "i");
const UUID_RE = new RegExp(`^${UUID}$`, "i");

const r2 = new AwsClient({
  accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
  service: "s3", region: "auto",
});
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const objectUrl = (key: string) =>
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/` + key.split("/").map(encodeURIComponent).join("/");

async function presign(method: "GET" | "PUT", key: string, ttl: number, params: Record<string, string> = {}) {
  const url = new URL(objectUrl(key));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  const signed = await r2.sign(new Request(url, { method }), { aws: { signQuery: true } });
  return signed.url;
}

function safeName(name: string) {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.slice(-150) || "video.mov";
}
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];

async function hmacHex(secret: string, body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function triggerAnalysis(ownerId: string, videoId: string, key: string, fileName: string) {
  const url = await presign("GET", key, ANALYZER_GET_TTL);
  const body = JSON.stringify({ videoId, ownerId, key, fileName, url });
  const res = await fetch(`${ANALYZER_URL.replace(/\/$/, "")}/analyze`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-signature": await hmacHex(ANALYZER_SECRET, body) }, body,
  });
  if (!res.ok) console.error("analyzer responded", res.status, await res.text().catch(() => ""));
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401, cors);

    const canAccess = async (path: string, write: boolean) => {
      const { data, error } = await userClient.rpc("can_access_video_path", { p_path: path, p_write: write });
      if (error) throw new Error(`access check failed: ${error.message}`);
      return data === true;
    };
    // Validates the key shape + access; returns the owner/video ids embedded in it.
    const guardKey = async (key: unknown, write = true) => {
      const m = typeof key === "string" ? key.match(KEY_RE) : null;
      if (!m) return { err: json({ error: "Invalid key" }, 400, cors) };
      if (!(await canAccess(key as string, write))) return { err: json({ error: "Forbidden" }, 403, cors) };
      return { key: key as string, ownerId: m[1].toLowerCase(), videoId: m[2].toLowerCase() };
    };
    const body = await req.json().catch(() => ({}));

    // ---------- init ----------
    if (body.action === "init") {
      const ownerId: string = (body.owner_id ?? user.id).toLowerCase();
      const videoId: string = String(body.video_id ?? "").toLowerCase();
      const fileName: string = body.file_name;
      const size = Number(body.size);
      if (!UUID_RE.test(ownerId) || !UUID_RE.test(videoId) || !fileName || !Number.isFinite(size) || size <= 0)
        return json({ error: "owner_id, video_id, file_name and size are required" }, 400, cors);
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXT.includes(ext)) return json({ error: `Unsupported file type. Allowed: ${ALLOWED_EXT.join(", ")}` }, 400, cors);
      if (size > MAX_BYTES) return json({ error: `File too large (max ${MAX_BYTES / GIB} GB)` }, 413, cors);

      const { data: row } = await admin.from("video_releases").select("id").eq("id", videoId).eq("user_id", ownerId).maybeSingle();
      if (!row) return json({ error: "Save the video details first, then upload the file." }, 404, cors);

      const key = `${ownerId}/videos/${videoId}/${safeName(fileName)}`;
      if (!KEY_RE.test(key)) return json({ error: "Invalid file name" }, 400, cors);
      if (!(await canAccess(key, true))) return json({ error: "Forbidden" }, 403, cors);

      const partSize = Math.max(BASE_PART, Math.ceil(size / (MAX_PARTS - 1)));
      const res = await r2.fetch(`${objectUrl(key)}?uploads`, {
        method: "POST", headers: { "Content-Type": ext === "mov" ? "video/quicktime" : "video/mp4" },
      });
      const xml = await res.text();
      const uploadId = tag(xml, "UploadId");
      if (!res.ok || !uploadId) { console.error("create multipart failed", res.status, xml); return json({ error: "Couldn’t start the upload" }, 502, cors); }
      return json({ key, uploadId, partSize, partCount: Math.ceil(size / partSize) }, 200, cors);
    }

    // ---------- part-urls ----------
    if (body.action === "part-urls") {
      const g = await guardKey(body.key); if (g.err) return g.err;
      const nums: number[] = Array.isArray(body.part_numbers) ? body.part_numbers.map(Number) : [];
      if (!body.upload_id || nums.length === 0 || nums.length > 100 || nums.some((n) => !Number.isInteger(n) || n < 1 || n > MAX_PARTS))
        return json({ error: "upload_id and 1–100 valid part_numbers required" }, 400, cors);
      const urls: Record<string, string> = {};
      for (const n of nums) urls[n] = await presign("PUT", g.key!, PART_URL_TTL, { partNumber: String(n), uploadId: String(body.upload_id) });
      return json({ urls, expiresIn: PART_URL_TTL }, 200, cors);
    }

    // ---------- list-parts (resume after refresh) ----------
    if (body.action === "list-parts") {
      const g = await guardKey(body.key); if (g.err) return g.err;
      if (!body.upload_id) return json({ error: "upload_id required" }, 400, cors);
      const parts: { partNumber: number; etag: string; size: number }[] = [];
      let marker = "0";
      for (let guard = 0; guard < 20; guard++) {
        const res = await r2.fetch(`${objectUrl(g.key!)}?uploadId=${encodeURIComponent(body.upload_id)}&max-parts=1000&part-number-marker=${marker}`);
        const xml = await res.text();
        if (res.status === 404 || xml.includes("NoSuchUpload")) return json({ expired: true }, 200, cors);
        if (!res.ok) return json({ error: "Couldn’t read upload progress" }, 502, cors);
        for (const m of xml.matchAll(/<Part>([\s\S]*?)<\/Part>/g)) {
          parts.push({ partNumber: Number(tag(m[1], "PartNumber")), etag: (tag(m[1], "ETag") ?? "").replace(/&quot;/g, '"'), size: Number(tag(m[1], "Size")) });
        }
        if (tag(xml, "IsTruncated") !== "true") break;
        marker = tag(xml, "NextPartNumberMarker") ?? marker;
      }
      return json({ parts }, 200, cors);
    }

    // ---------- complete ----------
    if (body.action === "complete") {
      const g = await guardKey(body.key); if (g.err) return g.err;
      const parts: { partNumber: number; etag: string }[] = Array.isArray(body.parts) ? body.parts : [];
      if (!body.upload_id || parts.length === 0 || parts.length > MAX_PARTS) return json({ error: "upload_id and parts required" }, 400, cors);
      if (String(body.video_id ?? "").toLowerCase() !== g.videoId) return json({ error: "video_id doesn’t match the key" }, 400, cors);

      const { data: row } = await admin.from("video_releases").select("id, video_path").eq("id", g.videoId).eq("user_id", g.ownerId).maybeSingle();
      if (!row) return json({ error: "Video not found for this account" }, 404, cors);

      const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
      const xmlBody = `<CompleteMultipartUpload>${sorted.map((p) =>
        `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${xmlEsc(p.etag)}</ETag></Part>`).join("")}</CompleteMultipartUpload>`;
      const res = await r2.fetch(`${objectUrl(g.key!)}?uploadId=${encodeURIComponent(body.upload_id)}`, {
        method: "POST", headers: { "Content-Type": "application/xml" }, body: xmlBody,
      });
      const resXml = await res.text();
      if (!res.ok || resXml.includes("<Error>")) { console.error("complete failed", res.status, resXml); return json({ error: "Couldn’t finish the upload — please try again." }, 502, cors); }

      const head = await r2.fetch(objectUrl(g.key!), { method: "HEAD" });
      const size = Number(head.headers.get("content-length") ?? 0);
      if (!head.ok || size <= 0) return json({ error: "Uploaded file not found" }, 404, cors);
      if (size > MAX_BYTES) { await r2.fetch(objectUrl(g.key!), { method: "DELETE" }); return json({ error: `File too large (max ${MAX_BYTES / GIB} GB)` }, 413, cors); }

      const analyzerOn = !!(ANALYZER_URL && ANALYZER_SECRET);
      const { error: upErr } = await admin.from("video_releases").update({
        video_storage_provider: "r2", video_path: g.key, video_file_name: String(body.file_name ?? g.key!.split("/").pop()),
        video_size_bytes: size, video_meta: null, video_duration: null, video_width: null, video_height: null,
        spec_status: analyzerOn ? "pending" : "review",
        spec_check: analyzerOn ? null : [{ key: "manual", label: "Technical checks", status: "warn", detail: "Our team will verify codec, frame rate and bitrate before delivery.", tier: 2 }],
      }).eq("id", g.videoId);
      if (upErr) { console.error("row update failed", upErr); return json({ error: "Uploaded, but saving failed — please retry." }, 500, cors); }

      // replaced with a differently named file -> remove the old object
      if (row.video_path && row.video_path !== g.key && KEY_RE.test(row.video_path)) {
        r2.fetch(objectUrl(row.video_path), { method: "DELETE" }).catch(() => {});
      }
      if (analyzerOn) {
        const p = triggerAnalysis(g.ownerId, g.videoId, g.key!, String(body.file_name ?? "")).catch((e) => console.error("trigger analysis failed", e));
        // deno-lint-ignore no-explicit-any
        (globalThis as any).EdgeRuntime?.waitUntil?.(p);
      }
      return json({ ok: true, key: g.key, size, analyzing: analyzerOn }, 200, cors);
    }

    // ---------- abort ----------
    if (body.action === "abort") {
      const g = await guardKey(body.key); if (g.err) return g.err;
      if (!body.upload_id) return json({ error: "upload_id required" }, 400, cors);
      await r2.fetch(`${objectUrl(g.key!)}?uploadId=${encodeURIComponent(body.upload_id)}`, { method: "DELETE" });
      return json({ ok: true }, 200, cors);
    }

    // ---------- download-url ----------
    if (body.action === "download-url") {
      const id = String(body.video_id ?? "");
      if (!UUID_RE.test(id)) return json({ error: "video_id required" }, 400, cors);
      const { data: row } = await admin.from("video_releases").select("video_path, video_file_name").eq("id", id).maybeSingle();
      if (!row?.video_path) return json({ error: "Not found" }, 404, cors);
      if (!(await canAccess(row.video_path, false))) return json({ error: "Forbidden" }, 403, cors);
      const extra: Record<string, string> = {};
      if (body.download) extra["response-content-disposition"] = `attachment; filename="${safeName(row.video_file_name ?? "video.mov")}"`;
      return json({ url: await presign("GET", row.video_path, GET_TTL, extra), expiresIn: GET_TTL }, 200, cors);
    }

    // ---------- delete ----------
    if (body.action === "delete") {
      const g = await guardKey(body.key); if (g.err) return g.err;
      const res = await r2.fetch(objectUrl(g.key!), { method: "DELETE" });
      if (!res.ok && res.status !== 404) return json({ error: "R2 delete failed" }, 502, cors);
      await admin.from("video_releases").update({
        video_path: null, video_file_name: null, video_size_bytes: null, video_meta: null,
        video_duration: null, video_width: null, video_height: null, spec_check: null, spec_status: "pending",
      }).eq("id", g.videoId).eq("video_path", g.key);
      return json({ ok: true }, 200, cors);
    }

    return json({ error: "Unknown action" }, 400, cors);
  } catch (e) {
    console.error("r2-video error:", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500, cors);
  }
});
