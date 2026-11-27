// supabase/functions/check-follows-youtube/index.ts
//
// Exchanges a Google OAuth code, then READS whether the user is subscribed to the RADR channel
// (Google blocks programmatic subscribing, so the user must subscribe manually first).
//
// Secrets (set via `supabase secrets set`):
//   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI, RADR_YOUTUBE_CHANNEL_ID
//
// verify_jwt is OFF on purpose: this runs on the public submission form before any sign-in.
// Error responses never include Google's raw error body.

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
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

  const CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET");
  const REDIRECT_URI = Deno.env.get("YOUTUBE_REDIRECT_URI");
  const RADR_YOUTUBE_CHANNEL_ID = Deno.env.get("RADR_YOUTUBE_CHANNEL_ID");

  if (!RADR_YOUTUBE_CHANNEL_ID) {
    console.error("RADR_YOUTUBE_CHANNEL_ID secret is not set");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing channel ID" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID ?? "",
        client_secret: CLIENT_SECRET ?? "",
        redirect_uri: REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("YouTube token exchange failed:", tokenData?.error, tokenData?.error_description);
      return new Response(
        JSON.stringify({ error: "Token exchange failed" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const subRes = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${encodeURIComponent(RADR_YOUTUBE_CHANNEL_ID)}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const subData = await subRes.json();

    if (subData.error) {
      console.error("YouTube subscriptions API error:", subData.error);
      return new Response(
        JSON.stringify({ error: "YouTube API error" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const isSubscribed = Array.isArray(subData.items) && subData.items.length > 0;

    return new Response(JSON.stringify({ followed: { youtube: isSubscribed } }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("checkFollowsYoutube error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
