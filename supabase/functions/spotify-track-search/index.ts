// supabase/functions/spotify-track-search/index.ts
//
// Track lookup for the artist "New campaign" flow. Any signed-in user.
//   POST { query }  -> { tracks: [...] }
// query is a song name, or a Spotify track link / URI.
//
// Uses Spotify's app-only (client credentials) login: public track data only,
// no user account and no playlist access. The client secret stays on the server.
//
// Secrets: STUDIO_SPOTIFY_CLIENT_ID, STUDIO_SPOTIFY_CLIENT_SECRET, STUDIO_SECRET_KEY
// (falls back to SUPABASE_SERVICE_ROLE_KEY). Auto-provided: SUPABASE_URL
//
// verify_jwt is OFF on purpose: the function checks the session token itself.

import { createClient } from "npm:@supabase/supabase-js@2";

const SP = "https://api.spotify.com/v1";
const TRACK_RE = /(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/;

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "https://www.artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
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

// deno-lint-ignore no-explicit-any
function mapTrack(t: any) {
  return {
    spotify_id: t.id,
    name: t.name ?? "",
    artists: (t.artists ?? []).map((a: { name: string }) => a.name),
    album: t.album?.name ?? null,
    release_date: t.album?.release_date ?? null,
    image: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    duration_ms: t.duration_ms ?? null,
    isrc: t.external_ids?.isrc ?? null,
  };
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

  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (query.length < 2 || query.length > 200) return json({ error: "Enter 2 to 200 characters" }, 400, headers);

  try {
    const linked = query.match(TRACK_RE)?.[1];
    const path = linked
      ? `/tracks/${linked}`
      : `/search?${new URLSearchParams({ q: query, type: "track", limit: "8" })}`;
    const res = await fetch(SP + path, { headers: { Authorization: `Bearer ${await appToken()}` } });

    if (linked && res.status === 404) return json({ tracks: [] }, 200, headers);
    if (!res.ok) {
      if (res.status === 401) cached = null;
      console.error("Spotify lookup failed:", res.status);
      return json({ error: `Spotify lookup failed (${res.status})` }, 502, headers);
    }
    const data = await res.json();
    const found = linked ? [data] : data?.tracks?.items ?? [];
    // deno-lint-ignore no-explicit-any
    return json({ tracks: found.filter((t: any) => t?.id).map(mapTrack) }, 200, headers);
  } catch (err) {
    console.error("spotify-track-search error:", err);
    return json({ error: "Spotify lookup failed" }, 502, headers);
  }
});
