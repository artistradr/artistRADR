import { supabase } from "../../../supabaseClient";
import {
  API, SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES, SPOTIFY_REDIRECT,
  YOUTUBE_CLIENT_ID, YOUTUBE_REDIRECT,
} from "./config";

// Resolves with { code } on success, or { error } on failure, where error is
// one of: "denied" (user/provider explicitly returned ?error=...), "closed"
// (popup closed or timed out with no message ever received — this covers
// both a genuine cancel with no error param AND a message that silently
// failed to deliver, e.g. an opener/popup origin mismatch). Distinguishing
// these two from a flat `null` return is what lets handleOAuth show a
// specific message instead of one generic "cancelled" string for every case.
export function openOAuthPopup(platform) {
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);
  const urls = {
    spotify: `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&state=${state}`,
    youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${state}&access_type=offline&prompt=consent`,
  };
  const popup = window.open(urls[platform], `${platform}_oauth`, "width=520,height=640,scrollbars=yes");
  return new Promise((resolve) => {
    const handler = (e) => {
      if (e.data?.type === `${platform}_oauth_code`) {
        window.removeEventListener("message", handler);
        clearInterval(timer);
        resolve({ code: e.data.code });
      } else if (e.data?.type === `${platform}_oauth_error`) {
        window.removeEventListener("message", handler);
        clearInterval(timer);
        resolve({ error: "denied" });
      }
    };
    window.addEventListener("message", handler);
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.removeEventListener("message", handler);
        resolve({ error: "closed" });
      }
    }, 600);
  });
}

// Sends the signed-in user's session token so the server can record the verification
// against that user. The server, not the browser, decides what counts as verified.
// For Spotify the redirect_uri used at /authorize is sent too: Spotify requires the token
// exchange to repeat it exactly, so the server no longer has to guess between prod and local.
export async function callAPI(platform, code) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { "Content-Type": "application/json" };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const payload = platform === "spotify" ? { code, redirect_uri: SPOTIFY_REDIRECT } : { code };
    const res = await fetch(API[platform], { method: "POST", headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch { return null; }
}
