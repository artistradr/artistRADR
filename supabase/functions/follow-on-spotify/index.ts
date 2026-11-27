// supabase/functions/follow-on-spotify/index.ts
//
// Exchanges a Spotify OAuth code, then FOLLOWS the RADR profile + 3 playlists on the user's behalf.
//
// Secrets (set via `supabase secrets set`):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
//
// verify_jwt is OFF on purpose: this runs on the public submission form before any sign-in.
// Error responses never include Spotify's raw error body.
//
// NOTE: PUT /me/following and PUT /playlists/{id}/followers are deprecated as of Spotify's
// Feb 2026 Dev Mode migration; both are replaced by a single PUT /me/library call that takes
// Spotify URIs. See https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

const RADR_SPOTIFY_USER_ID = "31etosst62tr3hqwcdiepfw3hjk4";
const PLAYLISTS = [
  { key: "spotify_new_music", id: "3Vq2POEX6IcMsPwvdG6iMv" },
  { key: "spotify_discoveries", id: "57Gyugs4KtBVdsJZ18QY6o" },
  { key: "spotify_spotlight", id: "47z1mPJWmcVg9JgHHat8xf" },
];

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const code = typeof body?.code === "string" ? body.code : "";
  if (!code || code.length > 2000) {
    return new Response(JSON.stringify({ error: "Missing code" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const REDIRECT_URI = Deno.env.get("SPOTIFY_REDIRECT_URI");

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI ?? "",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Spotify token exchange failed:", tokenData?.error, tokenData?.error_description);
      return new Response(
        JSON.stringify({ error: "Token exchange failed" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const token = tokenData.access_token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Single call, unified library endpoint. URIs, not bare IDs. Spotify documents `uris` as a
    // comma-separated query-string param; the body copy is a safety net.
    const uris = [
      `spotify:user:${RADR_SPOTIFY_USER_ID}`,
      ...PLAYLISTS.map((p) => `spotify:playlist:${p.id}`),
    ];
    const urisParam = encodeURIComponent(uris.join(","));

    const libraryRes = await fetch(`https://api.spotify.com/v1/me/library?uris=${urisParam}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ uris }),
    });

    const followed: Record<string, boolean> = {};

    if (libraryRes.status === 200 || libraryRes.status === 204) {
      // The endpoint applies all-or-nothing per request; a clean success means every URI was saved.
      followed.spotify_profile = true;
      PLAYLISTS.forEach((p) => { followed[p.key] = true; });
    } else {
      const errBody = await libraryRes.clone().text();
      console.error(
        `Spotify /me/library follow failed: status=${libraryRes.status} uris=${JSON.stringify(uris)} body=${errBody}`
      );
      followed.spotify_profile = false;
      PLAYLISTS.forEach((p) => { followed[p.key] = false; });
    }

    if (!Object.values(followed).every(Boolean)) {
      console.warn("Some Spotify follows failed:", followed);
    }

    return new Response(JSON.stringify({ followed }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("followOnSpotify error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
