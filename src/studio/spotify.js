// src/studio/spotify.js
//
// Browser-side helpers for connecting RADR Studio to Spotify.
// No secrets here: the Client ID is public, and the code-for-token exchange
// happens in the studio-spotify Edge Function.

import { supabase } from "../supabaseClient";

const CLIENT_ID = import.meta.env.VITE_STUDIO_SPOTIFY_CLIENT_ID;
const STATE_KEY = "radr_studio_spotify_state";

export const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export const hasClientId = Boolean(CLIENT_ID);

// Spotify only accepts http redirects on 127.0.0.1, not "localhost".
export const isWrongLocalHost = () => window.location.hostname === "localhost";

export const redirectUri = () => `${window.location.origin}/studio/spotify/callback`;

export function startSpotifyConnect() {
  if (!CLIENT_ID) {
    throw new Error("Missing VITE_STUDIO_SPOTIFY_CLIENT_ID in .env.studio");
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "true",
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

// True only if the state Spotify sent back matches the one we stored.
export function consumeState(returned) {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return Boolean(saved) && saved === returned;
}

async function callFunction(body) {
  const { data, error } = await supabase.functions.invoke("studio-spotify", { body });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context.json();
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  return data;
}

export const exchangeCode = (code) =>
  callFunction({ action: "connect", code, redirect_uri: redirectUri() });

export const disconnectSpotify = () => callFunction({ action: "disconnect" });