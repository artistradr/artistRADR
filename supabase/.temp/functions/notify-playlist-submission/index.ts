// supabase/functions/notify-playlist-submission/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { payload, spotify_verified, instagram_verified, youtube_verified, submitted_at } = await req.json();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RADR Submissions <submissions@artistradr.com>",
      to: ["support@artistradr.com"],
      reply_to: payload.email,
      subject: `New submission: ${payload.artistName} — ${payload.trackName}`,
      html: `
        <p><strong>Artist:</strong> ${payload.artistName}</p>
        <p><strong>Track:</strong> ${payload.trackName}</p>
        <p><strong>Genre:</strong> ${payload.genre || "—"}</p>
        <p><strong>Spotify:</strong> <a href="${payload.spotifyLink}">${payload.spotifyLink}</a></p>
        <p><strong>Submitter email:</strong> ${payload.email}</p>
        <p><strong>Notes:</strong> ${payload.notes || "—"}</p>
        <hr>
        <p>Verified: Spotify ${spotify_verified ? "✓" : "✗"} · Instagram ${instagram_verified ? "✓" : "✗"} · YouTube ${youtube_verified ? "✓" : "✗"}</p>
        <p style="color:#888;font-size:12px">Submitted ${submitted_at}</p>
      `,
    }),
  });

  if (!res.ok) return new Response(await res.text(), { status: 500 });
  return new Response("ok", { status: 200 });
});