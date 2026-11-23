// supabase/functions/studio-spotify/index.ts
//
// RADR Studio — Spotify connection, reading, search, preview, approved sync (staff only).
//
// Actions (POST JSON):
//   { action: "connect", code, redirect_uri }  -> exchange login code, store tokens
//   { action: "disconnect" }                   -> remove this user's Spotify connection
//   { action: "playlist_tracks", playlist_id } -> read tracks of a radr_playlists row (uuid)
//   { action: "search", query }                -> search Spotify tracks (max 10 results)
//   { action: "write_test" }                   -> round trip on a throwaway PRIVATE playlist
//   { action: "preview", draft_id }            -> diff draft vs live playlist (read-only)
//   { action: "sync", draft_id }               -> apply an APPROVED draft to the live playlist
//
// Secrets: STUDIO_SPOTIFY_CLIENT_ID, STUDIO_SPOTIFY_CLIENT_SECRET
// Auto-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// verify_jwt is OFF on purpose: this function authenticates the caller itself
// (session token -> user -> profiles.role = 'radrStaff').

import { createClient } from "npm:@supabase/supabase-js@2";

const SP = "https://api.spotify.com/v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LIVE_PAGES = 20; // 1000 tracks

const ALLOWED_REDIRECTS = [
  "http://127.0.0.1:5174/studio/spotify/callback",
  "https://studio.artistradr.com/studio/spotify/callback",
];

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

// ── Token helper ─────────────────────────────────────────────────────────────────
// Valid access token for the caller's Spotify account, refreshed if it expires
// within 60 seconds. On invalid_grant the account is marked 'error' and callers
// must stop until a human reconnects.
class SpotifyAuthError extends Error {}
class SpotifyApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// deno-lint-ignore no-explicit-any
async function getAccessToken(admin: any, userId: string): Promise<string> {
  const { data: account } = await admin
    .from("connected_accounts")
    .select("id, status")
    .eq("user_id", userId)
    .eq("provider", "spotify")
    .maybeSingle();
  if (!account) throw new SpotifyAuthError("Spotify is not connected");
  if (account.status !== "active") {
    throw new SpotifyAuthError("Spotify connection needs to be reconnected");
  }

  const { data: secret } = await admin
    .from("connected_account_secrets")
    .select("access_token, refresh_token, expires_at")
    .eq("account_id", account.id)
    .maybeSingle();
  if (!secret) throw new SpotifyAuthError("Spotify tokens are missing, please reconnect");

  const expiresAt = secret.expires_at ? new Date(secret.expires_at).getTime() : 0;
  if (secret.access_token && expiresAt - Date.now() > 60_000) return secret.access_token;

  const clientId = Deno.env.get("STUDIO_SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("STUDIO_SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Spotify app is not configured on the server");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: secret.refresh_token,
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.access_token) {
    console.error("Spotify refresh failed:", res.status, data?.error, data?.error_description);
    if (data?.error === "invalid_grant") {
      await admin
        .from("connected_accounts")
        .update({
          status: "error",
          last_error: "Spotify refused the saved login. Reconnect Spotify.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);
      throw new SpotifyAuthError("Spotify login expired, please reconnect");
    }
    throw new Error(`Spotify token refresh failed (${res.status})`);
  }

  await admin.from("connected_account_secrets").update({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? secret.refresh_token,
    expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("account_id", account.id);

  return data.access_token;
}

// deno-lint-ignore no-explicit-any
function mapTrack(t: any, extra: Record<string, unknown> = {}) {
  return {
    spotify_id: t.id ?? null,
    uri: t.uri ?? null,
    name: t.name ?? "",
    artists: (t.artists ?? []).map((a: { name: string }) => a.name),
    album: t.album?.name ?? null,
    image: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
    duration_ms: t.duration_ms ?? null,
    isrc: t.external_ids?.isrc ?? null,
    is_local: !!t.is_local,
    ...extra,
  };
}

// ── Spotify HTTP helper ───────────────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
type SpResult = { ok: boolean; status: number; data: any; msg: string };

async function sp(accessToken: string, method: string, path: string, body?: unknown): Promise<SpResult> {
  const res = await fetch(SP + path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => "");
  // deno-lint-ignore no-explicit-any
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  const raw = data?.error?.message ?? (typeof data?.error === "string" ? data.error : "");
  return { ok: res.ok, status: res.status, data, msg: String(raw ?? "").slice(0, 200) };
}

// ── Live playlist reading (for preview + sync) ───────────────────────────────────────
interface LiveItem {
  uri: string;
  name: string;
  artists: string[];
}
interface LiveRead {
  items: LiveItem[];
  local_files: number;
  unreadable: number;
  truncated: boolean;
}

async function readLive(accessToken: string, externalId: string): Promise<LiveRead> {
  const out: LiveRead = { items: [], local_files: 0, unreadable: 0, truncated: false };
  let path: string | null = `/playlists/${encodeURIComponent(externalId)}/items?limit=50`;
  let pages = 0;
  while (path) {
    if (pages >= MAX_LIVE_PAGES) {
      out.truncated = true;
      break;
    }
    const r = await sp(accessToken, "GET", path);
    if (!r.ok) throw new SpotifyApiError(r.status, r.msg || `Spotify returned ${r.status}`);
    for (const row of r.data?.items ?? []) {
      const t = row?.item ?? row?.track;
      if (!t || !t.uri) {
        out.unreadable++;
        continue;
      }
      if (t.is_local || String(t.uri).startsWith("spotify:local:")) {
        out.local_files++;
        continue;
      }
      out.items.push({
        uri: t.uri,
        name: t.name ?? "",
        artists: (t.artists ?? []).map((a: { name: string }) => a.name),
      });
    }
    const next: string | null = r.data?.next ?? null;
    path = next ? next.replace(SP, "") : null;
    pages++;
  }
  return out;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const liveHash = (items: LiveItem[]) => sha256(items.map((i) => i.uri).join("\n"));

// ── Draft loading ─────────────────────────────────────────────────────────────────
interface FinalItem {
  item_id: string;
  uri: string | null;
  name: string;
  artists: string[];
}

// deno-lint-ignore no-explicit-any
async function loadDraft(admin: any, draftId: string) {
  const { data: draft } = await admin
    .from("playlist_drafts")
    .select("id, playlist_id, status, approved_at, approved_live_hash")
    .eq("id", draftId)
    .maybeSingle();
  if (!draft) return null;

  const { data: pl } = await admin
    .from("radr_playlists")
    .select("id, platform, external_id, title")
    .eq("id", draft.playlist_id)
    .maybeSingle();

  const { data: rows } = await admin
    .from("playlist_draft_items")
    .select("id, position, track_id, tracks(title, artists)")
    .eq("draft_id", draftId)
    .order("position")
    .order("id");

  // deno-lint-ignore no-explicit-any
  const trackIds = (rows ?? []).map((r: any) => r.track_id);
  const uriByTrack = new Map<string, string>();
  if (trackIds.length) {
    const { data: matches } = await admin
      .from("track_platform_matches")
      .select("track_id, external_id")
      .eq("platform", "spotify")
      .eq("match_status", "confirmed")
      .in("track_id", trackIds);
    for (const m of matches ?? []) uriByTrack.set(m.track_id, `spotify:track:${m.external_id}`);
  }

  // deno-lint-ignore no-explicit-any
  const items: FinalItem[] = (rows ?? []).map((r: any) => ({
    item_id: r.id,
    uri: uriByTrack.get(r.track_id) ?? null,
    name: r.tracks?.title ?? "",
    artists: r.tracks?.artists ?? [],
  }));

  return { draft, playlist: pl, items };
}

function buildDiff(live: LiveItem[], final: FinalItem[]) {
  const liveSet = new Set(live.map((l) => l.uri));
  const finalSet = new Set(final.map((f) => f.uri));
  const adds = final.filter((f) => f.uri && !liveSet.has(f.uri));
  const removes = live.filter((l) => !finalSet.has(l.uri));
  const liveCommon = live.filter((l) => finalSet.has(l.uri)).map((l) => l.uri);
  const finalCommon = final.filter((f) => f.uri && liveSet.has(f.uri)).map((f) => f.uri);
  const moved = finalCommon.reduce((n, u, i) => n + (liveCommon[i] !== u ? 1 : 0), 0);
  return { adds, removes, moved };
}

function blockers(live: LiveRead, final: FinalItem[]): string[] {
  const out: string[] = [];
  const unmatched = final.filter((f) => !f.uri).length;
  if (unmatched) out.push(`${unmatched} draft track(s) have no confirmed Spotify match`);
  if (live.local_files) out.push(`The live playlist has ${live.local_files} local file(s) that a sync would delete`);
  if (live.unreadable) out.push(`The live playlist has ${live.unreadable} unavailable item(s) that a sync would delete`);
  if (live.truncated) out.push("The live playlist is too long to sync safely");
  if (final.length === 0) out.push("The draft is empty");
  if (final.length > MAX_LIVE_PAGES * 50) out.push("The draft is too long to sync safely");
  return out;
}

// ── Write test ────────────────────────────────────────────────────────────
interface Step {
  step: string;
  ok: boolean;
  status?: number;
  note?: string;
}

async function runWriteTest(accessToken: string) {
  const steps: Step[] = [];
  const call = (m: string, p: string, b?: unknown) => sp(accessToken, m, p, b);
  const count = async (pid: string) => {
    const r = await call("GET", `/playlists/${pid}/items?limit=5`);
    return { r, n: r.data?.items?.length ?? 0 };
  };

  const found = await call("GET", `/search?${new URLSearchParams({ q: "afrobeats", type: "track", limit: "1" })}`);
  const track = found.data?.tracks?.items?.[0];
  if (!found.ok || !track?.uri) {
    steps.push({ step: "find a track", ok: false, status: found.status, note: found.msg || "no result" });
    return { steps };
  }
  steps.push({ step: "find a track", ok: true, status: found.status });
  const uri: string = track.uri;

  const created = await call("POST", "/me/playlists", {
    name: "RADR Studio write test (safe to delete)",
    public: false,
    description: "Created by RADR Studio to test playlist writes. Safe to delete.",
  });
  if (!created.ok || !created.data?.id) {
    steps.push({ step: "create private playlist", ok: false, status: created.status, note: created.msg });
    return { steps };
  }
  const pid: string = created.data.id;
  steps.push({ step: "create private playlist", ok: true, status: created.status });
  const result = { playlist_id: pid, playlist_url: created.data?.external_urls?.spotify ?? null };

  let seg = "items";
  let added = await call("POST", `/playlists/${pid}/items`, { uris: [uri] });
  if (!added.ok && (added.status === 404 || added.status === 405)) {
    seg = "tracks";
    added = await call("POST", `/playlists/${pid}/tracks`, { uris: [uri] });
  }
  steps.push({ step: "add a track", ok: added.ok, status: added.status, note: added.ok ? `worked via /${seg}` : added.msg });

  const c1 = await count(pid);
  steps.push({
    step: "read the playlist back",
    ok: c1.r.ok && (added.ok ? c1.n === 1 : true),
    status: c1.r.status,
    note: c1.r.ok ? `${c1.n} track(s) found` : c1.r.msg,
  });

  let removed: SpResult = { ok: false, status: 0, data: null, msg: "skipped (add failed)" };
  if (added.ok) {
    removed = await call("DELETE", `/playlists/${pid}/${seg}`, seg === "items" ? { items: [{ uri }] } : { tracks: [{ uri }] });
  }
  steps.push({ step: "remove the track", ok: removed.ok, status: removed.status || undefined, note: removed.ok ? "" : removed.msg });

  if (removed.ok) {
    const c2 = await count(pid);
    steps.push({
      step: "confirm it is empty",
      ok: c2.r.ok && c2.n === 0,
      status: c2.r.status,
      note: c2.r.ok ? `${c2.n} track(s) found` : c2.r.msg,
    });
  }

  // Replace-contents (PUT): the call the approved sync is built on.
  const put1 = await call("PUT", `/playlists/${pid}/items`, { uris: [uri] });
  steps.push({ step: "replace contents with one track (PUT)", ok: put1.ok, status: put1.status, note: put1.ok ? "" : put1.msg });
  let replaceWorks = false;
  if (put1.ok) {
    const c3 = await count(pid);
    const put2 = await call("PUT", `/playlists/${pid}/items`, { uris: [] });
    const c4 = await count(pid);
    replaceWorks = c3.n === 1 && put2.ok && c4.n === 0;
    steps.push({
      step: "replace contents with nothing (PUT) and confirm",
      ok: replaceWorks,
      status: put2.status,
      note: `after replace: ${c3.n} track(s); after clear: ${c4.n} track(s)`,
    });
  }

  let cleanup = await call("DELETE", `/playlists/${pid}/followers`);
  if (!cleanup.ok) {
    cleanup = await call("DELETE", `/me/library?${new URLSearchParams({ uris: `spotify:playlist:${pid}` })}`);
  }
  steps.push({
    step: "remove test playlist from profile",
    ok: cleanup.ok,
    status: cleanup.status,
    note: cleanup.ok ? "" : "could not auto-remove; delete it by hand in Spotify",
  });

  return { steps, ...result, writes_work: added.ok && removed.ok, replace_works: replaceWorks };
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // 1. Who is calling?
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in" }, 401, headers);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401, headers);
  const user = userData.user;

  // 2. Staff only.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "radrStaff") return json({ error: "Staff only" }, 403, headers);

  let body: {
    action?: string;
    code?: string;
    redirect_uri?: string;
    playlist_id?: string;
    draft_id?: string;
    query?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  // ── connect ────────────────────────────────────────────────────────────
  if (body.action === "connect") {
    const { code, redirect_uri } = body;
    if (!code || !redirect_uri || !ALLOWED_REDIRECTS.includes(redirect_uri)) {
      return json({ error: "Missing code or redirect URI not allowed" }, 400, headers);
    }

    const clientId = Deno.env.get("STUDIO_SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("STUDIO_SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return json({ error: "Spotify app is not configured on the server" }, 500, headers);
    }

    try {
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token || !tokenData.refresh_token) {
        console.error("Spotify token exchange failed:", tokenData?.error, tokenData?.error_description);
        return json(
          { error: `Spotify rejected the login code (${tokenData?.error ?? "unknown"})` },
          400,
          headers,
        );
      }

      const meRes = await fetch(`${SP}/me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!meRes.ok) {
        console.error("Spotify /me failed:", meRes.status);
        return json({ error: `Could not read the Spotify profile (${meRes.status})` }, 502, headers);
      }
      const me = await meRes.json();

      const { data: account, error: accErr } = await admin
        .from("connected_accounts")
        .upsert(
          {
            user_id: user.id,
            provider: "spotify",
            provider_account_id: me.id,
            display_name: me.display_name ?? me.id,
            scopes: tokenData.scope ?? null,
            status: "active",
            last_error: null,
            connected_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        )
        .select("id")
        .single();
      if (accErr || !account) throw accErr ?? new Error("No account row returned");

      const { error: secErr } = await admin.from("connected_account_secrets").upsert(
        {
          account_id: account.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "account_id" },
      );
      if (secErr) throw secErr;

      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "spotify.connected",
        entity_type: "connected_account",
        entity_id: account.id,
        details: { spotify_id: me.id },
      });

      return json({ connected: true, display_name: me.display_name ?? me.id, spotify_id: me.id }, 200, headers);
    } catch (err) {
      console.error("studio-spotify connect error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── disconnect ─────────────────────────────────────────────────────────
  if (body.action === "disconnect") {
    const { error } = await admin
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "spotify");
    if (error) {
      console.error("studio-spotify disconnect error:", error);
      return json({ error: "Could not disconnect" }, 500, headers);
    }
    await admin.from("activity_logs").insert({
      actor_id: user.id,
      action: "spotify.disconnected",
      entity_type: "connected_account",
      details: {},
    });
    return json({ disconnected: true }, 200, headers);
  }

  // ── playlist_tracks ────────────────────────────────────────────────────
  if (body.action === "playlist_tracks") {
    const playlistId = body.playlist_id;
    if (!playlistId || !UUID_RE.test(playlistId)) {
      return json({ error: "Missing or invalid playlist_id" }, 400, headers);
    }

    const { data: pl } = await admin
      .from("radr_playlists")
      .select("id, platform, external_id, title")
      .eq("id", playlistId)
      .maybeSingle();
    if (!pl || pl.platform !== "spotify" || !pl.external_id) {
      return json({ error: "Spotify playlist not found" }, 404, headers);
    }

    try {
      const accessToken = await getAccessToken(admin, user.id);

      // deno-lint-ignore no-explicit-any
      const tracks: any[] = [];
      let path: string | null = `/playlists/${encodeURIComponent(pl.external_id)}/items?limit=50`;
      let pages = 0;

      while (path && pages < 6) {
        const r = await sp(accessToken, "GET", path);
        if (!r.ok) {
          console.error("Spotify playlist items failed:", r.status, r.msg);
          await admin.from("radr_playlists").update({
            sync_status: "error",
            sync_error: `Spotify returned ${r.status} when reading tracks`,
          }).eq("id", pl.id);
          return json(
            { error: `Spotify returned ${r.status} when reading this playlist`, spotify_status: r.status },
            502,
            headers,
          );
        }
        for (const row of r.data?.items ?? []) {
          const t = row?.item ?? row?.track;
          if (!t || t.type === "episode") continue;
          tracks.push(mapTrack(t, { added_at: row.added_at ?? null }));
        }
        const next: string | null = r.data?.next ?? null;
        path = next ? next.replace(SP, "") : null;
        pages++;
      }

      await admin.from("radr_playlists").update({
        last_synced_at: new Date().toISOString(),
        sync_status: "ok",
        sync_error: null,
      }).eq("id", pl.id);

      return json({ playlist: { id: pl.id, title: pl.title }, count: tracks.length, tracks }, 200, headers);
    } catch (err) {
      if (err instanceof SpotifyAuthError) {
        return json({ error: err.message, needs_reconnect: true }, 409, headers);
      }
      console.error("studio-spotify playlist_tracks error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── search ────────────────────────────────────────────────────────────
  if (body.action === "search") {
    const q = (body.query ?? "").trim();
    if (q.length < 2 || q.length > 100) {
      return json({ error: "Search text must be 2 to 100 characters" }, 400, headers);
    }

    try {
      const accessToken = await getAccessToken(admin, user.id);
      const r = await sp(accessToken, "GET", `/search?${new URLSearchParams({ q, type: "track", limit: "10" })}`);
      if (!r.ok) {
        console.error("Spotify search failed:", r.status, r.msg);
        return json({ error: `Spotify search failed (${r.status})`, spotify_status: r.status }, 502, headers);
      }
      // deno-lint-ignore no-explicit-any
      const tracks = (r.data?.tracks?.items ?? []).filter((t: any) => t && t.id).map((t: any) => mapTrack(t));
      return json({ count: tracks.length, tracks }, 200, headers);
    } catch (err) {
      if (err instanceof SpotifyAuthError) {
        return json({ error: err.message, needs_reconnect: true }, 409, headers);
      }
      console.error("studio-spotify search error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── write_test ────────────────────────────────────────────────────
  if (body.action === "write_test") {
    try {
      const accessToken = await getAccessToken(admin, user.id);
      const report = await runWriteTest(accessToken);
      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "spotify.write_test",
        entity_type: "connected_account",
        details: report,
      });
      return json(report, 200, headers);
    } catch (err) {
      if (err instanceof SpotifyAuthError) {
        return json({ error: err.message, needs_reconnect: true }, 409, headers);
      }
      console.error("studio-spotify write_test error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── preview (read-only) ────────────────────────────────────────────────
  // Compares the draft to a fresh read of the live playlist. Changes nothing.
  if (body.action === "preview") {
    if (!body.draft_id || !UUID_RE.test(body.draft_id)) {
      return json({ error: "Missing or invalid draft_id" }, 400, headers);
    }
    try {
      const d = await loadDraft(admin, body.draft_id);
      if (!d || !d.playlist) return json({ error: "Draft not found" }, 404, headers);
      if (!["draft", "ready", "approved"].includes(d.draft.status)) {
        return json({ error: `This draft is ${d.draft.status} and can no longer be changed` }, 409, headers);
      }
      if (d.playlist.platform !== "spotify" || !d.playlist.external_id) {
        return json({ error: "Only Spotify playlists can be previewed" }, 400, headers);
      }

      const accessToken = await getAccessToken(admin, user.id);
      const live = await readLive(accessToken, d.playlist.external_id);
      const diff = buildDiff(live.items, d.items);
      const fmtItem = (i: { name: string; artists: string[] }) => ({ name: i.name, artists: i.artists });

      return json(
        {
          draft: { id: d.draft.id, status: d.draft.status },
          playlist: { title: d.playlist.title },
          live_count: live.items.length,
          final_count: d.items.length,
          adds: diff.adds.map(fmtItem),
          removes: diff.removes.map(fmtItem),
          moved: diff.moved,
          local_files: live.local_files,
          unreadable: live.unreadable,
          blocked: blockers(live, d.items),
          live_hash: await liveHash(live.items),
          item_ids: d.items.map((i) => i.item_id),
        },
        200,
        headers,
      );
    } catch (err) {
      if (err instanceof SpotifyAuthError) {
        return json({ error: err.message, needs_reconnect: true }, 409, headers);
      }
      if (err instanceof SpotifyApiError) {
        return json({ error: `Spotify returned ${err.status} when reading the playlist`, spotify_status: err.status }, 502, headers);
      }
      console.error("studio-spotify preview error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── sync (approved drafts only) ─────────────────────────────────────
  // Safety rules:
  //  - draft must be 'approved' (any edit after approval cancels it, in the database)
  //  - the live playlist must be identical to what was previewed at approval time
  //  - one job per approval (unique idempotency key), so a double click cannot apply twice
  //  - after writing, the playlist is read back and must equal the draft exactly
  if (body.action === "sync") {
    if (!body.draft_id || !UUID_RE.test(body.draft_id)) {
      return json({ error: "Missing or invalid draft_id" }, 400, headers);
    }

    const d = await loadDraft(admin, body.draft_id);
    if (!d || !d.playlist) return json({ error: "Draft not found" }, 404, headers);
    if (d.draft.status !== "approved" || !d.draft.approved_at || !d.draft.approved_live_hash) {
      return json({ error: "This draft is not approved" }, 409, headers);
    }
    if (d.playlist.platform !== "spotify" || !d.playlist.external_id) {
      return json({ error: "Only Spotify playlists can be synced" }, 400, headers);
    }

    const idempotencyKey = `sync:${d.draft.id}:${d.draft.approved_at}`;
    const { data: job, error: jobErr } = await admin
      .from("playlist_sync_jobs")
      .insert({
        playlist_id: d.playlist.id,
        draft_id: d.draft.id,
        status: "running",
        trigger: "manual",
        requested_by: user.id,
        idempotency_key: idempotencyKey,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      if (jobErr?.code === "23505") {
        const { data: existing } = await admin
          .from("playlist_sync_jobs")
          .select("status, result")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (existing?.status === "succeeded") {
          return json({ synced: true, already_applied: true, result: existing.result }, 200, headers);
        }
        return json({ error: "This approval has already been used. Review and approve again." }, 409, headers);
      }
      console.error("studio-spotify sync job error:", jobErr);
      return json({ error: "Could not start the sync" }, 500, headers);
    }

    const fail = async (message: string, resetDraft: boolean, status = 409, extra: Record<string, unknown> = {}) => {
      await admin.from("playlist_sync_jobs").update({
        status: "failed",
        error: message,
        finished_at: new Date().toISOString(),
      }).eq("id", job.id);
      await admin.from("radr_playlists").update({ sync_status: "error", sync_error: message }).eq("id", d.playlist!.id);
      if (resetDraft) {
        await admin.from("playlist_drafts").update({
          status: "draft",
          approved_by: null,
          approved_at: null,
          approved_live_hash: null,
          updated_at: new Date().toISOString(),
        }).eq("id", d.draft.id);
      }
      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "playlist.sync_failed",
        entity_type: "playlist",
        entity_id: d.playlist!.id,
        details: { draft_id: d.draft.id, job_id: job.id, error: message },
      });
      return json({ error: message, ...extra }, status, headers);
    };

    try {
      const accessToken = await getAccessToken(admin, user.id);
      const externalId = d.playlist.external_id;

      const live = await readLive(accessToken, externalId);
      if ((await liveHash(live.items)) !== d.draft.approved_live_hash) {
        return await fail("The playlist changed on Spotify after you approved. Nothing was changed. Review the changes again.", true);
      }
      const reasons = blockers(live, d.items);
      if (reasons.length) {
        return await fail(`Sync blocked: ${reasons.join("; ")}.`, true);
      }

      const diff = buildDiff(live.items, d.items);
      await admin.from("playlist_sync_jobs").update({
        diff: { adds: diff.adds.length, removes: diff.removes.length, moved: diff.moved },
      }).eq("id", job.id);

      const uris = d.items.map((i) => i.uri as string);

      // First 100 replace the playlist contents; any remainder is appended in order.
      const first = await sp(accessToken, "PUT", `/playlists/${encodeURIComponent(externalId)}/items`, { uris: uris.slice(0, 100) });
      if (!first.ok) {
        // Nothing has been written yet.
        return await fail(`Spotify refused to update the playlist (${first.status}). Nothing was changed.`, false, 502);
      }
      for (let i = 100; i < uris.length; i += 100) {
        const more = await sp(accessToken, "POST", `/playlists/${encodeURIComponent(externalId)}/items`, { uris: uris.slice(i, i + 100) });
        if (!more.ok) {
          return await fail(
            `Spotify stopped part-way (${more.status}). The playlist is only partly updated. Review the changes again.`,
            true,
            502,
          );
        }
      }

      // Verify: the live playlist must now equal the draft, in order.
      const after = await readLive(accessToken, externalId);
      const same = after.items.length === uris.length && after.items.every((it, i) => it.uri === uris[i]);
      if (!same) {
        return await fail("Spotify did not end up matching the draft. Review the playlist and try again.", true, 502);
      }

      const result = {
        final_count: uris.length,
        added: diff.adds.length,
        removed: diff.removes.length,
        moved: diff.moved,
      };
      const now = new Date().toISOString();
      await admin.from("playlist_sync_jobs").update({ status: "succeeded", result, finished_at: now }).eq("id", job.id);
      await admin.from("playlist_drafts").update({ status: "applied", updated_at: now }).eq("id", d.draft.id);
      await admin.from("radr_playlists").update({ last_synced_at: now, sync_status: "ok", sync_error: null }).eq("id", d.playlist.id);
      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "playlist.synced",
        entity_type: "playlist",
        entity_id: d.playlist.id,
        details: { draft_id: d.draft.id, job_id: job.id, ...result },
      });

      return json({ synced: true, result }, 200, headers);
    } catch (err) {
      if (err instanceof SpotifyAuthError) {
        return await fail(err.message, false, 409, { needs_reconnect: true });
      }
      if (err instanceof SpotifyApiError) {
        return await fail(`Spotify returned ${err.status} while reading the playlist. Nothing was changed.`, false, 502);
      }
      console.error("studio-spotify sync error:", err);
      return await fail("Unexpected error during sync. Check the playlist on Spotify before retrying.", true, 500);
    }
  }

  return json({ error: "Unknown action" }, 400, headers);
});
