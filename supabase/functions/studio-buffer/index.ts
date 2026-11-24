// studio-buffer: send approved Studio artwork to Buffer as a DRAFT (nothing is published).
//
// Actions (POST JSON, staff session required):
//   { action: "channels" }
//   { action: "create_draft", artwork_id, channel_id, channel_name?, service?, caption, image_url }
//
// Secrets: BUFFER_API_KEY (personal key from Buffer Settings > API; never sent to the browser).
// Server key: STUDIO_SECRET_KEY, falling back to SUPABASE_SERVICE_ROLE_KEY. Auto-provided: SUPABASE_URL.
// verify_jwt is OFF on purpose: this function authenticates the caller itself (staff only).
// Deploy: supabase functions deploy studio-buffer --no-verify-jwt --use-api

import { createClient } from "npm:@supabase/supabase-js@2";

const BUFFER = "https://api.buffer.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

// deno-lint-ignore no-explicit-any
async function gql(apiKey: string, query: string, variables?: Record<string, unknown>): Promise<any> {
  const res = await fetch(BUFFER, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new Error("Buffer rejected the API key (401). Create a new key in Buffer Settings > API.");
  if (res.status === 429) throw new Error("Buffer rate limit reached. Try again later.");
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(`Buffer request failed (${res.status})`);
  // Buffer can return rate-limit and validation errors with HTTP 200.
  if (data.errors?.length) throw new Error(data.errors[0].message ?? "Buffer returned an error");
  return data.data;
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(
    supabaseUrl,
    (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
    { auth: { persistSession: false } },
  );

  // 1. Who is calling? 2. Staff only.
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in" }, 401, headers);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401, headers);
  const user = userData.user;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "radrStaff") return json({ error: "Staff only" }, 403, headers);

  const apiKey = Deno.env.get("BUFFER_API_KEY");
  if (!apiKey) return json({ error: "BUFFER_API_KEY is not set for this function" }, 500, headers);

  let body: {
    action?: string;
    artwork_id?: string;
    channel_id?: string;
    channel_name?: string;
    service?: string;
    caption?: string;
    image_url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  try {
    // ── channels ─────────────────────────────────────────────────────────
    if (body.action === "channels") {
      const orgs = await gql(apiKey, `query { account { organizations { id name } } }`);
      const channels: { id: string; name: string; service: string; organization: string }[] = [];
      for (const org of orgs?.account?.organizations ?? []) {
        const d = await gql(
          apiKey,
          `query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) { id name service } }`,
        );
        for (const c of d?.channels ?? []) channels.push({ ...c, organization: org.name });
      }
      return json({ channels }, 200, headers);
    }

    // ── create_draft ─────────────────────────────────────────────────────
    if (body.action === "create_draft") {
      const { artwork_id, channel_id, caption, image_url } = body;
      if (!artwork_id || !UUID_RE.test(artwork_id)) return json({ error: "Invalid artwork_id" }, 400, headers);
      if (!channel_id || !/^[\w-]{1,100}$/.test(channel_id)) return json({ error: "Invalid channel_id" }, 400, headers);
      if (!caption || caption.length > 2200) return json({ error: "Caption missing or too long" }, 400, headers);
      // Only our own public bucket may be attached.
      const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/studio-public/`;
      if (!image_url || !image_url.startsWith(allowedPrefix)) {
        return json({ error: "Image must be in the studio-public bucket" }, 400, headers);
      }

      // Reserve the slot first. The unique index blocks a second live draft for the same artwork + channel.
      const { data: row, error: insErr } = await admin
        .from("buffer_posts")
        .insert({
          artwork_id,
          channel_id,
          channel_name: body.channel_name ?? null,
          service: body.service ?? null,
          caption,
          image_url,
          status: "sending",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (insErr) {
        if (insErr.code === "23505") {
          return json({ error: "This artwork already has a Buffer draft for that channel." }, 409, headers);
        }
        throw new Error(insErr.message);
      }

      try {
        const d = await gql(
          apiKey,
          `mutation CreatePost($input: CreatePostInput!) {
             createPost(input: $input) {
               ... on PostActionSuccess { post { id } }
               ... on MutationError { message }
             }
           }`,
          {
            input: {
              channelId: channel_id,
              text: caption,
              schedulingType: "automatic",
              mode: "addToQueue",
              saveToDraft: true,
              assets: [{ image: { url: image_url } }],
            },
          },
        );
        const result = d?.createPost;
        if (!result?.post?.id) throw new Error(result?.message ?? "Buffer did not create the draft");

        await admin.from("buffer_posts").update({ status: "draft", buffer_post_id: result.post.id }).eq("id", row.id);
        await admin.from("activity_logs").insert({
          actor_id: user.id,
          action: "buffer.draft_created",
          entity_type: "top10_artworks",
          entity_id: artwork_id,
          details: { channel_id, buffer_post_id: result.post.id },
        }).then(() => {}, () => {}); // logging must never fail the request
        return json({ ok: true, buffer_post_id: result.post.id }, 200, headers);
      } catch (e) {
        await admin.from("buffer_posts").update({ status: "failed", error: String((e as Error).message) }).eq("id", row.id);
        throw e;
      }
    }

    return json({ error: "Unknown action" }, 400, headers);
  } catch (e) {
    return json({ error: (e as Error).message }, 502, headers);
  }
});
