// supabase/functions/studio-instagram/index.ts
//
// RADR Studio — Instagram discovery (staff only), via the official Instagram Graph API
// with Facebook login. Reads PUBLIC data of other Business/Creator accounts
// (Business Discovery). Point-in-time counts only: growth comes from our own snapshots.
//
// Actions (POST JSON):
//   { action: "status" }                              -> is Instagram connected?
//   { action: "connect", code, redirect_uri, page_id? } -> exchange Facebook login code, store Page token
//   { action: "disconnect" }                          -> remove the Instagram connection
//   { action: "lookup", username }                    -> read one account (nothing is saved)
//   { action: "add_account", username, notes? }       -> add to the watchlist + first snapshot
//   { action: "remove_account", account_id }          -> remove from the watchlist (snapshots too)
//   { action: "snapshot", account_id? }               -> new snapshot for one account, or all active (max 40)
//
// Secrets: META_APP_ID, META_APP_SECRET
// Server key: STUDIO_SECRET_KEY (a Supabase secret key, sb_secret_...), falling back to the auto-provided
// SUPABASE_SERVICE_ROLE_KEY. Auto-provided: SUPABASE_URL
//
// verify_jwt is OFF on purpose: this function authenticates the caller itself
// (session token -> user -> profiles.role = 'radrStaff').

import { createClient } from "npm:@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v27.0";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME_RE = /^[a-z0-9._]{1,30}$/;
const MAX_SNAPSHOT_BATCH = 40;
const POSTS_PER_ACCOUNT = 12;

const ALLOWED_REDIRECTS = [
  "http://127.0.0.1:5174/studio/instagram/callback",
  "https://studio.artistradr.com/studio/instagram/callback",
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

// ── Errors ───────────────────────────────────────────────────────────────────────
class IgAuthError extends Error {}
class IgApiError extends Error {
  status: number;
  code: number | null;
  subcode: number | null;
  constructor(status: number, code: number | null, subcode: number | null, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.subcode = subcode;
  }
}

// ── Graph helper ───────────────────────────────────────────────────────────────────
// The token travels in the Authorization header, never in the URL.
// deno-lint-ignore no-explicit-any
async function graph(token: string, path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const e = data?.error ?? {};
    const msg = String(e.message ?? `Instagram returned ${res.status}`).slice(0, 300);
    if (e.code === 190) throw new IgAuthError(msg);
    throw new IgApiError(res.status, e.code ?? null, e.error_subcode ?? null, msg);
  }
  return data;
}

// Token exchanges use a POST body so the app secret stays out of URLs and logs.
// deno-lint-ignore no-explicit-any
async function tokenExchange(params: Record<string, string>): Promise<any> {
  const res = await fetch(`${GRAPH}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    console.error("Meta token exchange failed:", res.status, data?.error?.code, data?.error?.message);
    throw new IgApiError(res.status, data?.error?.code ?? null, data?.error?.error_subcode ?? null,
      String(data?.error?.message ?? "Meta rejected the login").slice(0, 300));
  }
  return data;
}

// ── Connection ─────────────────────────────────────────────────────────────────────
// The Instagram connection is shared by all staff: any active one is used.
// deno-lint-ignore no-explicit-any
async function getConnection(admin: any): Promise<{ accountId: string; token: string; igUserId: string }> {
  const { data: account } = await admin
    .from("connected_accounts")
    .select("id, status, provider_account_id")
    .eq("provider", "instagram")
    .eq("status", "active")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!account || !account.provider_account_id) throw new IgAuthError("Instagram is not connected");

  const { data: secret } = await admin
    .from("connected_account_secrets")
    .select("access_token")
    .eq("account_id", account.id)
    .maybeSingle();
  if (!secret?.access_token) throw new IgAuthError("Instagram token is missing, please reconnect");

  return { accountId: account.id, token: secret.access_token, igUserId: account.provider_account_id };
}

// ── Business Discovery ───────────────────────────────────────────────────────────────
interface Post {
  id: string | null;
  caption: string | null;
  media_type: string | null;
  permalink: string | null;
  timestamp: string | null;
  like_count: number | null; // null when the account hides likes
  comments_count: number | null;
}
interface Profile {
  username: string;
  name: string | null;
  biography: string | null;
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  profile_picture_url: string | null;
  ig_user_id: string | null;
  posts: Post[];
  avg_likes: number | null;
  avg_comments: number | null;
  engagement_pct: number | null; // (avg likes + avg comments) / followers, in percent
  observed_at: string;
}

function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().replace(/^@/, "").toLowerCase();
  return USERNAME_RE.test(u) ? u : null;
}

async function discover(conn: { token: string; igUserId: string }, username: string): Promise<Profile> {
  const fields =
    `business_discovery.username(${username}){username,name,biography,followers_count,follows_count,media_count,profile_picture_url,` +
    `media.limit(${POSTS_PER_ACCOUNT}){caption,like_count,comments_count,timestamp,permalink,media_type}}`;
  const data = await graph(conn.token, `/${conn.igUserId}`, { fields });
  const bd = data?.business_discovery;
  if (!bd?.username) throw new IgApiError(404, null, null, "No data returned for that account");

  // deno-lint-ignore no-explicit-any
  const posts: Post[] = (bd.media?.data ?? []).map((m: any) => ({
    id: m.id ?? null,
    caption: typeof m.caption === "string" ? m.caption.slice(0, 300) : null,
    media_type: m.media_type ?? null,
    permalink: m.permalink ?? null,
    timestamp: m.timestamp ?? null,
    like_count: typeof m.like_count === "number" ? m.like_count : null,
    comments_count: typeof m.comments_count === "number" ? m.comments_count : null,
  }));

  const withLikes = posts.filter((p) => p.like_count !== null);
  const avgLikes = withLikes.length ? withLikes.reduce((n, p) => n + (p.like_count ?? 0), 0) / withLikes.length : null;
  const withComments = posts.filter((p) => p.comments_count !== null);
  const avgComments = withComments.length
    ? withComments.reduce((n, p) => n + (p.comments_count ?? 0), 0) / withComments.length
    : null;
  const followers = typeof bd.followers_count === "number" ? bd.followers_count : null;
  const engagement = followers && followers > 0 && avgLikes !== null
    ? ((avgLikes + (avgComments ?? 0)) / followers) * 100
    : null;
  const round = (n: number | null, d = 1) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

  return {
    username: String(bd.username).toLowerCase(),
    name: bd.name ?? null,
    biography: typeof bd.biography === "string" ? bd.biography.slice(0, 300) : null,
    followers_count: followers,
    follows_count: typeof bd.follows_count === "number" ? bd.follows_count : null,
    media_count: typeof bd.media_count === "number" ? bd.media_count : null,
    profile_picture_url: bd.profile_picture_url ?? null,
    ig_user_id: bd.id ?? null,
    posts,
    avg_likes: round(avgLikes),
    avg_comments: round(avgComments),
    engagement_pct: round(engagement, 2),
    observed_at: new Date().toISOString(),
  };
}

const NOT_FOUND_RE = /not exist|not a business|not a creator|business or creator|invalid user id|cannot be found/i;

function isNotFound(err: IgApiError): boolean {
  return err.code === 110 || err.subcode === 2207013 || NOT_FOUND_RE.test(err.message);
}

const NOT_FOUND_MSG =
  "Instagram could not find that account, or it is a personal account. Only Business and Creator accounts can be read.";

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    // New secret key first (set as the STUDIO_SECRET_KEY function secret); legacy key as fallback.
    (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
    { auth: { persistSession: false } },
  );

  // 1. Who is calling?
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in" }, 401, headers);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401, headers);
  const user = userData.user;

  // 2. Staff only.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "radrStaff") return json({ error: "Staff only" }, 403, headers);

  let body: {
    action?: string;
    code?: string;
    redirect_uri?: string;
    page_id?: string;
    username?: string;
    notes?: string;
    account_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  // Shared error mapping for everything that talks to Instagram.
  const handle = async (err: unknown, label: string) => {
    if (err instanceof IgAuthError) {
      await admin
        .from("connected_accounts")
        .update({ status: "error", last_error: "Instagram login expired or was revoked. Reconnect.", updated_at: new Date().toISOString() })
        .eq("provider", "instagram")
        .eq("status", "active");
      return json({ error: err.message, needs_reconnect: true }, 409, headers);
    }
    if (err instanceof IgApiError) {
      if (isNotFound(err)) return json({ error: NOT_FOUND_MSG, not_found: true }, 404, headers);
      if ([4, 17, 32, 613].includes(err.code ?? -1)) {
        return json({ error: "Instagram rate limit reached. Try again later.", rate_limited: true }, 429, headers);
      }
      console.error(`studio-instagram ${label} api error:`, err.status, err.code, err.subcode, err.message);
      return json({ error: `Instagram error: ${err.message}`, instagram_code: err.code }, 502, headers);
    }
    console.error(`studio-instagram ${label} error:`, err);
    return json({ error: "Internal server error" }, 500, headers);
  };

  // ── status ─────────────────────────────────────────────────────────────
  if (body.action === "status") {
    const { data: account } = await admin
      .from("connected_accounts")
      .select("id, status, display_name, provider_account_id, last_error, connected_at")
      .eq("provider", "instagram")
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!account) return json({ connected: false }, 200, headers);
    return json({
      connected: account.status === "active",
      status: account.status,
      display_name: account.display_name,
      last_error: account.last_error,
      connected_at: account.connected_at,
    }, 200, headers);
  }

  // ── connect ────────────────────────────────────────────────────────────
  if (body.action === "connect") {
    const { code, redirect_uri } = body;
    if (!code || !redirect_uri || !ALLOWED_REDIRECTS.includes(redirect_uri)) {
      return json({ error: "Missing code or redirect URI not allowed" }, 400, headers);
    }
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appId || !appSecret) return json({ error: "Meta app is not configured on the server" }, 500, headers);

    try {
      // login code -> short-lived user token -> long-lived user token
      const short = await tokenExchange({ client_id: appId, client_secret: appSecret, redirect_uri, code });
      const long = await tokenExchange({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: short.access_token,
      });

      // Pages this login can manage, with their linked Instagram account.
      const pages = await graph(long.access_token, "/me/accounts", {
        fields: "id,name,access_token,instagram_business_account{id,username}",
        limit: "50",
      });
      // deno-lint-ignore no-explicit-any
      const withIg = (pages?.data ?? []).filter((p: any) => p.instagram_business_account?.id && p.access_token);
      if (!withIg.length) {
        return json({ error: "No Facebook Page with a linked Instagram Business or Creator account was shared with the app" }, 400, headers);
      }

      // deno-lint-ignore no-explicit-any
      let page: any = null;
      if (body.page_id) page = withIg.find((p: any) => p.id === body.page_id);
      // deno-lint-ignore no-explicit-any
      else if (withIg.length === 1) page = withIg[0];
      // deno-lint-ignore no-explicit-any
      else page = withIg.find((p: any) => String(p.name).trim().toLowerCase() === "artistradr");
      if (!page) {
        return json({
          error: "Choose which Page to use",
          choose_page: true,
          // deno-lint-ignore no-explicit-any
          pages: withIg.map((p: any) => ({ id: p.id, name: p.name, instagram: p.instagram_business_account.username ?? null })),
        }, 409, headers);
      }

      const igId: string = page.instagram_business_account.id;
      const igName: string = page.instagram_business_account.username ?? page.name;

      const { data: account, error: accErr } = await admin
        .from("connected_accounts")
        .upsert(
          {
            user_id: user.id,
            provider: "instagram",
            provider_account_id: igId,
            display_name: `@${igName}`,
            scopes: "instagram_basic,instagram_manage_insights,pages_read_engagement,pages_show_list",
            status: "active",
            last_error: null,
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        )
        .select("id")
        .single();
      if (accErr || !account) throw accErr ?? new Error("No account row returned");

      // Page tokens made from a long-lived user token do not expire.
      const { error: secErr } = await admin.from("connected_account_secrets").upsert(
        {
          account_id: account.id,
          access_token: page.access_token,
          refresh_token: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "account_id" },
      );
      if (secErr) throw secErr;

      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "instagram.connected",
        entity_type: "connected_account",
        entity_id: account.id,
        details: { instagram: igName },
      });

      return json({ connected: true, display_name: `@${igName}` }, 200, headers);
    } catch (err) {
      if (err instanceof IgApiError) {
        return json({ error: `Meta rejected the login: ${err.message}` }, 400, headers);
      }
      console.error("studio-instagram connect error:", err);
      return json({ error: "Internal server error" }, 500, headers);
    }
  }

  // ── disconnect ─────────────────────────────────────────────────────────
  if (body.action === "disconnect") {
    const { error } = await admin.from("connected_accounts").delete().eq("provider", "instagram");
    if (error) {
      console.error("studio-instagram disconnect error:", error);
      return json({ error: "Could not disconnect" }, 500, headers);
    }
    await admin.from("activity_logs").insert({
      actor_id: user.id,
      action: "instagram.disconnected",
      entity_type: "connected_account",
      details: {},
    });
    return json({ disconnected: true }, 200, headers);
  }

  // ── lookup (read only, nothing saved) ──────────────────────────────────
  if (body.action === "lookup") {
    const username = normalizeUsername(body.username);
    if (!username) return json({ error: "Enter a valid Instagram username" }, 400, headers);
    try {
      const conn = await getConnection(admin);
      return json({ profile: await discover(conn, username) }, 200, headers);
    } catch (err) {
      return await handle(err, "lookup");
    }
  }

  // ── add_account ────────────────────────────────────────────────────────
  if (body.action === "add_account") {
    const username = normalizeUsername(body.username);
    if (!username) return json({ error: "Enter a valid Instagram username" }, 400, headers);
    try {
      const { data: existing } = await admin.from("discovery_ig_accounts").select("id").eq("username", username).maybeSingle();
      if (existing) return json({ error: "That account is already on the watchlist" }, 409, headers);

      const conn = await getConnection(admin);
      const p = await discover(conn, username);
      const now = new Date().toISOString();

      const { data: row, error: insErr } = await admin
        .from("discovery_ig_accounts")
        .insert({
          username: p.username,
          ig_user_id: p.ig_user_id,
          display_name: p.name,
          followers_count: p.followers_count,
          media_count: p.media_count,
          notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 500) || null : null,
          last_checked_at: now,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (insErr || !row) {
        if (insErr?.code === "23505") return json({ error: "That account is already on the watchlist" }, 409, headers);
        throw insErr ?? new Error("No row returned");
      }

      await admin.from("discovery_ig_snapshots").insert({
        account_id: row.id,
        observed_at: now,
        followers_count: p.followers_count,
        media_count: p.media_count,
        posts: p.posts,
      });
      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "instagram.account_added",
        entity_type: "discovery_ig_account",
        entity_id: row.id,
        details: { username: p.username },
      });
      return json({ added: true, account_id: row.id, profile: p }, 200, headers);
    } catch (err) {
      return await handle(err, "add_account");
    }
  }

  // ── remove_account ─────────────────────────────────────────────────────
  if (body.action === "remove_account") {
    if (!body.account_id || !UUID_RE.test(body.account_id)) {
      return json({ error: "Missing or invalid account_id" }, 400, headers);
    }
    const { data: gone, error } = await admin
      .from("discovery_ig_accounts")
      .delete()
      .eq("id", body.account_id)
      .select("username")
      .maybeSingle();
    if (error) {
      console.error("studio-instagram remove error:", error);
      return json({ error: "Could not remove the account" }, 500, headers);
    }
    if (!gone) return json({ error: "Account not found" }, 404, headers);
    await admin.from("activity_logs").insert({
      actor_id: user.id,
      action: "instagram.account_removed",
      entity_type: "discovery_ig_account",
      entity_id: body.account_id,
      details: { username: gone.username },
    });
    return json({ removed: true }, 200, headers);
  }

  // ── snapshot (one account or the whole active watchlist) ─────────────────
  if (body.action === "snapshot") {
    if (body.account_id && !UUID_RE.test(body.account_id)) {
      return json({ error: "Invalid account_id" }, 400, headers);
    }
    try {
      const conn = await getConnection(admin);
      let q = admin.from("discovery_ig_accounts").select("id, username").eq("is_active", true).order("last_checked_at", { ascending: true, nullsFirst: true });
      if (body.account_id) q = q.eq("id", body.account_id);
      const { data: accounts, error: listErr } = await q.limit(MAX_SNAPSHOT_BATCH);
      if (listErr) throw listErr;
      if (!accounts?.length) return json({ results: [], ok: 0, failed: 0 }, 200, headers);

      const results: { username: string; ok: boolean; error?: string }[] = [];
      for (const a of accounts) {
        try {
          const p = await discover(conn, a.username);
          const now = new Date().toISOString();
          await admin.from("discovery_ig_snapshots").insert({
            account_id: a.id,
            observed_at: now,
            followers_count: p.followers_count,
            media_count: p.media_count,
            posts: p.posts,
          });
          await admin.from("discovery_ig_accounts").update({
            followers_count: p.followers_count,
            media_count: p.media_count,
            display_name: p.name,
            last_checked_at: now,
            last_error: null,
            updated_at: now,
          }).eq("id", a.id);
          results.push({ username: a.username, ok: true });
        } catch (err) {
          // A dead login or rate limit stops the whole batch; a bad single account does not.
          if (err instanceof IgAuthError) throw err;
          if (err instanceof IgApiError && [4, 17, 32, 613].includes(err.code ?? -1)) {
            results.push({ username: a.username, ok: false, error: "Rate limit reached, batch stopped" });
            break;
          }
          const msg = err instanceof IgApiError && isNotFound(err) ? NOT_FOUND_MSG : "Could not read this account";
          await admin.from("discovery_ig_accounts").update({
            last_checked_at: new Date().toISOString(),
            last_error: msg,
            updated_at: new Date().toISOString(),
          }).eq("id", a.id);
          results.push({ username: a.username, ok: false, error: msg });
        }
      }
      const ok = results.filter((r) => r.ok).length;
      await admin.from("activity_logs").insert({
        actor_id: user.id,
        action: "instagram.snapshot",
        entity_type: "discovery_ig_account",
        entity_id: body.account_id ?? null,
        details: { ok, failed: results.length - ok },
      });
      return json({ results, ok, failed: results.length - ok }, 200, headers);
    } catch (err) {
      return await handle(err, "snapshot");
    }
  }

  return json({ error: "Unknown action" }, 400, headers);
});
