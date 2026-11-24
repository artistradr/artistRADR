// src/studio/instagram.js
//
// Browser-side helpers for connecting RADR Studio to Instagram (Facebook login).
// No secrets here: the Meta App ID is public, and the code-for-token exchange
// happens in the studio-instagram Edge Function.

import { supabase } from "../supabaseClient";

const APP_ID = import.meta.env.VITE_STUDIO_META_APP_ID;
// Only needed if the Meta app uses a Facebook Login for Business configuration.
const CONFIG_ID = import.meta.env.VITE_STUDIO_META_CONFIG_ID;
const STATE_KEY = "radr_studio_instagram_state";

export const INSTAGRAM_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export const hasMetaAppId = Boolean(APP_ID);

export const redirectUri = () => `${window.location.origin}/studio/instagram/callback`;

export function startInstagramConnect() {
  if (!APP_ID) {
    throw new Error("Missing VITE_STUDIO_META_APP_ID in .env.studio");
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri(),
    state,
    response_type: "code",
  });
  if (CONFIG_ID) params.set("config_id", CONFIG_ID);
  else params.set("scope", INSTAGRAM_SCOPES);

  window.location.assign(`https://www.facebook.com/v27.0/dialog/oauth?${params.toString()}`);
}

// True only if the state Facebook sent back matches the one we stored.
export function consumeState(returned) {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return Boolean(saved) && saved === returned;
}

export async function callInstagram(body) {
  const { data, error } = await supabase.functions.invoke("studio-instagram", { body });
  if (error) {
    let message = error.message;
    let payload = null;
    try {
      payload = await error.context.json();
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the generic message */
    }
    const err = new Error(message);
    err.payload = payload;
    throw err;
  }
  return data;
}

export const exchangeInstagramCode = (code) =>
  callInstagram({ action: "connect", code, redirect_uri: redirectUri() });

export const instagramStatus = () => callInstagram({ action: "status" });
export const disconnectInstagram = () => callInstagram({ action: "disconnect" });
