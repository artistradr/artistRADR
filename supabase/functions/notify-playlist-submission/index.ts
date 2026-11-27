// supabase/functions/notify-playlist-submission/index.ts
//
// Emails the RADR team when a new playlist submission arrives.
// Called by the database trigger notify_new_submission() with an x-webhook-secret header.
//
// verify_jwt is OFF on purpose: the caller is a database trigger, not a signed-in user.
// Everything in the submission came from a public form, so it is treated as untrusted:
// all text is HTML-escaped, the reply-to must be a real email address, and the Spotify
// link is only shown as a link when it points at open.spotify.com.

const esc = (v: unknown, max = 500) =>
  String(v ?? "")
    .slice(0, max)
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const oneLine = (v: unknown, max = 200) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, max);

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const SPOTIFY_RE = /^https:\/\/open\.spotify\.com\/[A-Za-z0-9\/_\-?=&.%]*$/;

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("WEBHOOK_SECRET");
  if (!expected) return new Response("Not configured", { status: 500 });
  if (!safeEqual(req.headers.get("x-webhook-secret") ?? "", expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  const { payload, spotify_verified, instagram_verified, youtube_verified, submitted_at } = body ?? {};
  if (!payload || typeof payload !== "object") return new Response("Bad body", { status: 400 });

  const email =
    typeof payload.email === "string" && payload.email.length <= 254 && EMAIL_RE.test(payload.email.trim())
      ? payload.email.trim()
      : null;
  const link =
    typeof payload.spotifyLink === "string" && payload.spotifyLink.length <= 300 && SPOTIFY_RE.test(payload.spotifyLink)
      ? payload.spotifyLink
      : null;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RADR Submissions <submissions@artistradr.com>",
      to: ["support@artistradr.com"],
      ...(email ? { reply_to: email } : {}),
      subject: `New submission: ${oneLine(payload.artistName, 80)} — ${oneLine(payload.trackName, 80)}`,
      html: `
        <p><strong>Artist:</strong> ${esc(payload.artistName, 120)}</p>
        <p><strong>Track:</strong> ${esc(payload.trackName, 120)}</p>
        <p><strong>Genre:</strong> ${esc(payload.genre, 80) || "—"}</p>
        <p><strong>Spotify:</strong> ${link ? `<a href="${esc(link, 300)}">${esc(link, 300)}</a>` : esc(payload.spotifyLink, 300) || "—"}</p>
        <p><strong>Submitter email:</strong> ${esc(payload.email, 254)}</p>
        <p><strong>Notes:</strong> ${esc(payload.notes, 1000) || "—"}</p>
        <hr>
        <p>Verified: Spotify ${spotify_verified ? "✓" : "✗"} · Instagram ${instagram_verified ? "✓" : "✗"} · YouTube ${youtube_verified ? "✓" : "✗"}</p>
        <p style="color:#888;font-size:12px">Submitted ${esc(submitted_at, 60)}</p>
      `,
    }),
  });

  if (!res.ok) return new Response(await res.text(), { status: 500 });
  return new Response("ok", { status: 200 });
});
