// supabase/functions/paystack/index.ts
//
// Paystack payments for artist campaigns.
//
//   POST { action: "init",   campaign_id }  -> { authorization_url, reference }   (signed-in artist)
//   POST { action: "verify", reference }    -> { status }                        (signed-in artist)
//   POST (Paystack webhook, x-paystack-signature header)                         (Paystack only)
//
// The price is read from the campaign row on the server. The browser never sends an amount.
// A payment is marked paid only after Paystack's own verify call confirms the reference,
// amount and currency. The webhook and the verify action share the same settle step,
// so a payment is never counted twice.
//
// Secrets: PAYSTACK_SECRET_KEY (required), PAYSTACK_CURRENCY (optional, default USD),
// STUDIO_SECRET_KEY (falls back to SUPABASE_SERVICE_ROLE_KEY). Auto-provided: SUPABASE_URL
//
// verify_jwt is OFF on purpose: the webhook has no Supabase session, and the user
// actions check the session token themselves.

import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK = "https://api.paystack.co";

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "https://www.artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
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

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function hmacSha512Hex(secret: string, text: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function paystack(path: string, secret: string, init: RequestInit = {}) {
  return fetch(PAYSTACK + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

type Admin = ReturnType<typeof createClient>;

// Ask Paystack about a reference and update our payments row to match.
// Safe to call many times: a row already marked paid is left alone.
async function settle(admin: Admin, reference: string, secret: string) {
  const { data: payment, error } = await admin
    .from("payments")
    .select("id, amount, currency, status")
    .eq("reference", reference)
    .maybeSingle();
  if (error) {
    console.error("payments lookup failed:", error.message);
    return { status: "error" };
  }
  if (!payment) return { status: "unknown" };
  if (payment.status === "paid") return { status: "paid" };

  const res = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`, secret);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status || !body?.data) {
    console.error("Paystack verify failed:", res.status, body?.message);
    return { status: "pending" };
  }

  const tx = body.data;
  if (tx.status === "success") {
    const expected = Math.round(Number(payment.amount) * 100);
    if (tx.amount !== expected || String(tx.currency).toUpperCase() !== payment.currency) {
      console.error("Paystack amount mismatch", { reference, got: tx.amount, expected, currency: tx.currency });
      return { status: "mismatch" };
    }
    const { error: upErr } = await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: tx.paid_at ?? new Date().toISOString(),
        method: tx.channel ?? null,
      })
      .eq("id", payment.id)
      .neq("status", "paid");
    if (upErr) {
      console.error("payments update failed:", upErr.message);
      return { status: "error" };
    }
    return { status: "paid" };
  }

  if (tx.status === "failed") {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id).eq("status", "pending");
    return { status: "failed" };
  }
  return { status: "pending" };
}

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  const webhookSig = req.headers.get("x-paystack-signature");

  // ---- Paystack webhook -------------------------------------------------
  if (webhookSig) {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!secret) return json({ error: "Payments are not configured" }, 500);

    const raw = await req.text();
    const expected = await hmacSha512Hex(secret, raw);
    if (!safeEqual(expected, webhookSig.toLowerCase())) return json({ error: "Bad signature" }, 401);

    let event: { event?: string; data?: { reference?: string } };
    try {
      event = JSON.parse(raw);
    } catch {
      return json({ error: "Bad body" }, 400);
    }

    if (event.event === "charge.success" && event.data?.reference) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
        { auth: { persistSession: false } },
      );
      const result = await settle(admin, event.data.reference, secret);
      // Ask Paystack to retry only when something went wrong on our side.
      if (result.status === "error") return json({ error: "Try again" }, 500);
    }
    return json({ received: true }, 200);
  }

  // ---- Signed-in artist actions -----------------------------------------
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);
  if (!secret) return json({ error: "Payments are not configured yet" }, 500, headers);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    (Deno.env.get("STUDIO_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
    { auth: { persistSession: false } },
  );
  const session = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!session) return json({ error: "Not signed in" }, 401, headers);
  const { data: userData, error: userErr } = await admin.auth.getUser(session);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401, headers);
  const user = userData.user;

  const body = await req.json().catch(() => null);
  const action = body?.action;

  try {
    // Start a payment: create a pending row, get Paystack's checkout link.
    if (action === "init") {
      const campaignId = typeof body?.campaign_id === "string" ? body.campaign_id : "";
      if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return json({ error: "Missing campaign" }, 400, headers);
      if (!user.email) return json({ error: "Your account has no email address" }, 400, headers);

      const origin = req.headers.get("origin");
      if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origin not allowed" }, 403, headers);

      const { data: campaign } = await admin
        .from("campaigns")
        .select("id, user_id, name, budget, status")
        .eq("id", campaignId)
        .maybeSingle();
      if (!campaign || campaign.user_id !== user.id) return json({ error: "Campaign not found" }, 404, headers);
      if (campaign.status === "removed") return json({ error: "This campaign was removed" }, 409, headers);

      const budget = Number(campaign.budget);
      if (!Number.isFinite(budget) || budget <= 0) return json({ error: "This campaign has no price yet" }, 400, headers);

      const { data: alreadyPaid } = await admin
        .from("payments")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("status", "paid")
        .limit(1);
      if (alreadyPaid && alreadyPaid.length > 0) return json({ error: "This campaign is already paid" }, 409, headers);

      const currency = (Deno.env.get("PAYSTACK_CURRENCY") ?? "USD").toUpperCase();
      const reference = `radr_${campaign.id.slice(0, 8)}_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;

      const { error: insErr } = await admin.from("payments").insert({
        user_id: user.id,
        campaign_id: campaign.id,
        amount: budget,
        currency,
        status: "pending",
        reference,
      });
      if (insErr) {
        console.error("payments insert failed:", insErr.message);
        return json({ error: "Could not start the payment" }, 500, headers);
      }

      const res = await paystack("/transaction/initialize", secret, {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(budget * 100),
          currency,
          reference,
          callback_url: `${origin}/campaigns/billing`,
          metadata: { campaign_id: campaign.id, user_id: user.id, campaign_name: campaign.name },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.status || !data?.data?.authorization_url) {
        console.error("Paystack initialize failed:", res.status, data?.message);
        await admin.from("payments").update({ status: "failed" }).eq("reference", reference);
        return json({ error: data?.message ?? "Paystack could not start the payment" }, 502, headers);
      }
      return json({ authorization_url: data.data.authorization_url, reference }, 200, headers);
    }

    // Check a payment after the artist comes back from Paystack.
    if (action === "verify") {
      const reference = typeof body?.reference === "string" ? body.reference : "";
      if (!reference || reference.length > 100) return json({ error: "Missing reference" }, 400, headers);

      const { data: mine } = await admin
        .from("payments")
        .select("id")
        .eq("reference", reference)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mine) return json({ error: "Payment not found" }, 404, headers);

      const result = await settle(admin, reference, secret);
      return json({ status: result.status }, 200, headers);
    }

    return json({ error: "Unknown action" }, 400, headers);
  } catch (err) {
    console.error("paystack function error:", err);
    return json({ error: "Payment request failed" }, 502, headers);
  }
});
