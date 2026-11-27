// supabase/functions/notify-submission-status/index.ts
//
// Emails an artist when staff approve or reject their playlist submission.
// Called by the database trigger notify_submission_status() with an x-webhook-secret header.
//
// verify_jwt is OFF on purpose: the caller is a database trigger, not a signed-in user.
// The artist name, track name and email were typed into a public form, so they are untrusted:
// all text is HTML-escaped, and nothing is sent unless the recipient is a valid email address.

const LOGO_URL = "https://rjivkemajotafjvtalol.supabase.co/storage/v1/object/public/post-covers/radr-logo.png";

const esc = (v: unknown, max = 200) =>
  String(v ?? "")
    .slice(0, max)
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const oneLine = (v: unknown, max = 120) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, max);

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function shell(innerHtml: string) {
  return `
  <div style="background:#f7f6f3;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
      <tr>
        <td style="background:#0E0E0E;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="Artist RADR" width="64" style="display:block;margin:0 auto;" />
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px;">
          ${innerHtml}
        </td>
      </tr>
      <tr>
        <td style="background:#f7f6f3;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="font-size:11px;color:#aaa;margin:0;">Artist RADR &middot; artistradr.com</p>
        </td>
      </tr>
    </table>
  </div>`;
}

// deno-lint-ignore no-explicit-any
const COPY: Record<string, { subject: (artist: string) => string; body: (artist: string, track: string) => string }> = {
  approved: {
    subject: (artist) => `You're in — ${artist} has been added to a RADR playlist`,
    body: (artist, track) => shell(`
      <div style="display:inline-block;background:rgba(34,197,94,0.1);color:#16a34a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 14px;border-radius:100px;margin-bottom:18px;">Accepted</div>
      <h1 style="font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#111;margin:0 0 12px;">You're on the playlist</h1>
      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 8px;">Hey ${artist},</p>
      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">Good news — <strong style="color:#333;">${track}</strong> has been selected for one of our curated playlists. We'll follow up separately with placement details.</p>
      <p style="font-size:13px;color:#999;line-height:1.6;margin:0;">Thanks for submitting to RADR — we're glad to have you.</p>
    `),
  },
  rejected: {
    subject: (artist) => `Update on your RADR submission — ${artist}`,
    body: (artist, track) => shell(`
      <div style="display:inline-block;background:rgba(0,0,0,0.05);color:#888;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 14px;border-radius:100px;margin-bottom:18px;">Reviewed</div>
      <h1 style="font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#111;margin:0 0 12px;">Thanks for submitting</h1>
      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 8px;">Hey ${artist},</p>
      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">Thanks for sending over <strong style="color:#333;">${track}</strong>. It's not the right fit for our current playlists, but we'd love to hear future releases — our lineup rotates regularly.</p>
      <p style="font-size:13px;color:#999;line-height:1.6;margin:0;">Keep making music. We mean that.</p>
    `),
  },
};

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
  const { status, payload } = body ?? {};
  const template = typeof status === "string" ? COPY[status] : undefined;
  if (!template) return new Response("Unhandled status", { status: 400 });
  if (!payload || typeof payload !== "object") return new Response("Bad body", { status: 400 });

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return new Response("No valid recipient", { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Artist RADR <hello@artistradr.com>",
      to: [email],
      subject: template.subject(oneLine(payload.artistName)),
      html: template.body(esc(payload.artistName, 120), esc(payload.trackName, 120)),
    }),
  });

  if (!res.ok) return new Response(await res.text(), { status: 500 });
  return new Response("ok", { status: 200 });
});
