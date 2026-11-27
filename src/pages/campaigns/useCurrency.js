// The artist's preferred currency (USD or NGN), shared by every screen without a provider.
// The choice is remembered in this browser. Naira amounts are estimates from today's rate;
// the amount actually charged is worked out again on the server when payment starts.
import { useEffect, useSyncExternalStore } from "react";
import { getRate } from "./payments";
import { formatMoney } from "./currency";

const STORAGE_KEY = "radr_currency";
const RATE_TTL_MS = 30 * 60 * 1000;

function readSaved() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "NGN" ? "NGN" : "USD";
  } catch {
    return "USD";
  }
}

let state = { currency: readSaved(), rate: null, rateAt: 0, failed: false };
let loading = false;
const listeners = new Set();

function change(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => state;

export function setCurrency(code) {
  const currency = code === "NGN" ? "NGN" : "USD";
  try {
    window.localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    // Storage can be blocked. The choice then lasts until the page is closed.
  }
  // Choosing Naira again gives a failed rate lookup another try.
  change({ currency, failed: false });
}

async function loadRate() {
  if (loading) return;
  loading = true;
  try {
    change({ rate: await getRate(), rateAt: Date.now(), failed: false });
  } catch {
    change({ failed: true });
  } finally {
    loading = false;
  }
}

export function useCurrency() {
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);
  const stale = !current.rate || Date.now() - current.rateAt > RATE_TTL_MS;

  useEffect(() => {
    if (current.currency === "NGN" && stale && !current.failed) loadRate();
  }, [current.currency, stale, current.failed]);

  const showNaira = current.currency === "NGN" && Boolean(current.rate);

  // Formats a USD price in the preferred currency. Falls back to USD until the rate arrives.
  function format(usd) {
    return showNaira ? formatMoney(Number(usd) * current.rate, "NGN") : formatMoney(usd, "USD");
  }

  return {
    currency: current.currency,
    rate: current.rate,
    rateFailed: current.failed,
    rateLoading: current.currency === "NGN" && !current.rate && !current.failed,
    setCurrency,
    format,
  };
}
