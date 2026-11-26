// supabase/functions/campaign-playlist-lookup/index.ts
//
// RADR Studio: look up a Spotify playlist so staff can attach it to a campaign. Staff only.
//   POST { url, track_id? } -> { playlist: { spotify_playlist_id, title, image_url, url }, has_track, checked }
// url is a Spotify playlist link or URI. track_id is the campaign's 22-character Spotify track id.
//
// Public playlist data only, using Spotify's app-only login. The client secret stays on the server.
// If the Spotify API refuses, Spotify's public oEmbed service supplies the title and cover instead.
// has_track is true/false when the playlist could be read, or null when it could not be checked.
//
// Secrets: STUDIO_SPOTIFY_CLIENT_ID, STUDIO_SPOTIFY_CLIENT_SECRET, STUDIO_SECRET_KEY
// (falls back to SUPABASE_SERVICE_ROLE_KEY). Auto-provided: SUPABASE_URL
//
// verify_jwt is OFF on purpose: the function checks the session and the staff role itself.

import { createClient } from "npm:@supabase/supabase-js@2";

const SP = "https://api.spotify.com/v1";
const ID_RE = /^[A-Za-z0-9]{22}$/;
const PLAYLIST_RE = /(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?playlist\/|spotify:playlist:)([A-Za-z0-9]{22})/;
const MAX_PAGES = 8; // 400 tracks

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5174",
  "http://localhost:5174",
  "https://studio.artistradr.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

let cached: { token: string; expiresAt: number } | null = null;

async function appToken(): Promise<string> {
  if (cached && cached.expiresAt - Date.now() > 60_000) return cached.token;
  const id = Deno.env.get("STUDIO_SPOTIFY_CLIENT_ID");
  const secret = Deno.env.get("STUDIO_SPOTIFY_CLIENT_SECRET");
  if (!id || !secret) throw new Error("Spotify app is not configured on the server");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${id}:${secret}`),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Spotify token request failed (${res.status})`);

  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function spGet(path: string) {
  const res = await fetch(path.startsWith("http") ? path : SP + path, {
    headers: { Authorization: `Bearer ${await appToken()}` },
  });
  if (res.status === 401) cached = null;
  // deno-lint-ignore no-explicit-any
  const data: any = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

interface Found {
  title: string | null;
  image_url: string | null;
}

// Title and cover from the Spotify API, falling back to the public oEmbed service.
async function readDetails(id: string): Promise<Found | null> {
  const api = await spGet(`/playlists/${id}?${new URLSearchParams({ fields: "name,images(url)" })}`);
  if (api.ok && api.data?.name) {
    return { title: api.data.name, image_url: api.data.images?.[0]?.url ?? null };
  }
  if (api.status === 404) return null; // private or does not exist

  const link = `https://open.spotify.com/playlist/${id}`;
  const res = await fetch(`https://open.spotify.com/oembed?${new URLSearchParams({ url: link })}`);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.title) return null;
  return { title: data.title, image_url: data.thumbnail_url ?? null };
}

// true / false when the playlist could be read, null when it could not be checked.
async function containsTrack(id: string, trackId: string): Promise<{ has: boolean | null; checked: number }> {
  let seg = "items";
  let path: string | null = `/playlists/${id}/${seg}?limit=50`;
  let pages = 0;
  let checked = 0;

  while (path && pages < MAX_PAGES) {
    let r = await spGet(path);
    if (!r.ok && pages === 0 && (r.status === 404 || r.status === 405) && seg === "items") {
      seg = "tracks";
      r = await spGet(`/playlists/${id}/${seg}?limit=50`);
    }
    if (!r.ok) return { has: null, checked };

    for (const row of r.data?.items ?? []) {
      const t = row?.item ?? row?.track;
      if (!t?.id) continue;
      checked++;
      if (t.id === trackId) return { has: true, checked };
    }
    path = r.data?.next ?? null;
    pages++;
  }
  // Not found: only a firm "no" if we read the whole playlist.
  return { has: path ? null : false, checked };
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
    { auth: { persistSession: false } },
  );

  const session = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!session) return json({ error: "Not signed in" }, 401, headers);
  const { data: userData, error: userErr } = await admin.auth.getUser(session);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401, headers);

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
  if (profile?.role !== "radrStaff") return json({ error: "Staff only" }, 403, headers);

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const id = url.length <= 300 ? url.match(PLAYLIST_RE)?.[1] : undefined;
  if (!id) return json({ error: "Paste a Spotify playlist link" }, 400, headers);
  const trackId = typeof body?.track_id === "string" && ID_RE.test(body.track_id) ? body.track_id : null;

  try {
    const found = await readDetails(id);
    if (!found) {
      return json({ error: "Could not read that playlist. Check that it is public and the link is right." }, 404, headers);
    }
    const check = trackId ? await containsTrack(id, trackId) : { has: null, checked: 0 };

    const image = found.image_url && found.image_url.startsWith("https://") && found.image_url.length <= 500
      ? found.image_url
      : null;
    return json(
      {
        playlist: {
          spotify_playlist_id: id,
          title: (found.title ?? "").slice(0, 200) || null,
          image_url: image,
          url: `https://open.spotify.com/playlist/${id}`,
        },
        has_track: check.has,
        checked: check.checked,
      },
      200,
      headers,
    );
  } catch (err) {
    console.error("campaign-playlist-lookup error:", err);
    return json({ error: "Spotify lookup failed" }, 502, headers);
  }
});
