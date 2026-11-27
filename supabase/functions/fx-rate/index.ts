// supabase/functions/fx-rate/index.ts
//
// Read-only: tells the browser how many Naira (or the Paystack charge currency) one US dollar
// costs, so prices can be shown in Naira before paying.
//
//   POST {} -> { currency, rate }
//
// This is a DISPLAY estimate only. The amount actually charged is always worked out again on the
// server by the paystack function when the payment starts, and nothing here can change it.
// It uses the same sources as the paystack function so the two figures stay close:
//   PAYSTACK_CURRENCY   charge currency, default NGN
//   USD_<CURRENCY>_RATE fallback rate if the live rate can't be fetched (e.g. USD_NGN_RATE)
//   FX_MARGIN_PERCENT   extra percent added to the rate, default 0 (same cap as paystack: 20)
//
// Exchange rates: open.er-api.com (ExchangeRate-API open access, updated daily).

const FX_URL = "https://open.er-api.com/v6/latest/USD";
const FX_TTL_MS = 60 * 60 * 1000;

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

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

let cache: { currency: string; rate: number; at: number } | null = null;

async function usdRate(currency: string): Promise<number> {
  if (currency === "USD") return 1;
  if (cache && cache.currency === currency && Date.now() - cache.at < FX_TTL_MS) return cache.rate;

  try {
    const res = await fetch(FX_URL, { signal: AbortSignal.timeout(5000) });
    const body = await res.json().catch(() => null);
    const rate = Number(body?.rates?.[currency]);
    if (res.ok && body?.result === "success" && Number.isFinite(rate) && rate > 0) {
      cache = { currency, rate, at: Date.now() };
      return rate;
    }
    console.error("FX lookup gave no usable rate:", res.status, body?.result);
  } catch (err) {
    console.error("FX lookup failed:", err);
  }

  const fallback = Number(Deno.env.get(`USD_${currency}_RATE`));
  if (Number.isFinite(fallback) && fallback > 0) return fallback;
  throw new Error("fx_unavailable");
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const currency = (Deno.env.get("PAYSTACK_CURRENCY") ?? "NGN").toUpperCase();
  try {
    const rate = await usdRate(currency);
    const marginPercent = Number(Deno.env.get("FX_MARGIN_PERCENT") ?? "0");
    const margin = Number.isFinite(marginPercent) && marginPercent > 0 && marginPercent <= 20 ? marginPercent : 0;
    const withMargin = Math.round(rate * (1 + margin / 100) * 10000) / 10000;
    return json({ currency, rate: withMargin }, 200, headers);
  } catch {
    return json({ error: "Exchange rate unavailable" }, 503, headers);
  }
});
