// supabase/functions/notify-submission-status/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

const COPY = {
  approved: {
    subject: (artist: string) => `You're in — ${artist} has been added to a RADR playlist`,
    body: (payload: any) => `
      <p>Hey ${payload.artistName},</p>
      <p>Good news — <strong>${payload.trackName}</strong> has been selected for one of our curated playlists.</p>
      <p>We'll follow up separately with details on placement. Thanks for submitting to RADR.</p>
    `,
  },
  rejected: {
    subject: (artist: string) => `Update on your RADR submission — ${artist}`,
    body: (payload: any) => `
      <p>Hey ${payload.artistName},</p>
      <p>Thanks for submitting <strong>${payload.trackName}</strong>. It's not the right fit for our current playlists, but we encourage you to submit future releases — our lineup rotates regularly.</p>
    `,
  },
};

serve(async (req) => {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { status, payload } = await req.json();
  const template = COPY[status as "approved" | "rejected"];
  if (!template) return new Response("Unhandled status", { status: 400 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Artist RADR <hello@artistradr.com>",
      to: [payload.email],
      subject: template.subject(payload.artistName),
      html: template.body(payload),
    }),
  });

  if (!res.ok) return new Response(await res.text(), { status: 500 });
  return new Response("ok", { status: 200 });
});