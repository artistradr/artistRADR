// functions/index.js
//
// Exports:
//   followOnSpotify    — exchanges OAuth code, then FOLLOWS profile + 3 playlists on user's behalf
//   checkFollowsYoutube — exchanges OAuth code, then READS subscription status (Google blocks programmatic subs)
//
// Environment variables (set via Firebase secrets):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
//   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI

import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import fetch from "node-fetch";

setGlobalOptions({ region: "us-central1" });

const ALLOWED_ORIGINS = [
  "https://artistradr.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

function cors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// ─── Spotify IDs ──────────────────────────────────────────────────────────────
const RADR_SPOTIFY_USER_ID = "31etosst62tr3hqwcdiepfw3hjk4";
const PLAYLISTS = [
  { key: "spotify_new_music",    id: "3Vq2POEX6IcMsPwvdG6iMv" },
  { key: "spotify_discoveries",  id: "57Gyugs4KtBVdsJZ18QY6o" },
  { key: "spotify_spotlight",    id: "47z1mPJWmcVg9JgHHat8xf" },
];

// ─── YouTube Channel ID ───────────────────────────────────────────────────────
// Find yours: youtube.com/@ArtistRADR → About → Share → Copy channel ID
const RADR_YOUTUBE_CHANNEL_ID = "YOUR_YOUTUBE_CHANNEL_ID";

// ─────────────────────────────────────────────────────────────────────────────
// followOnSpotify
// Exchanges the OAuth code then calls:
//   PUT /me/following?type=user&ids=...         → follow RADR profile
//   PUT /playlists/{id}/followers               → follow each playlist
// Returns { followed: { spotify_profile, spotify_new_music, ... } }
// ─────────────────────────────────────────────────────────────────────────────
export const followOnSpotify = onRequest(async (req, res) => {
  if (cors(req, res)) return;

  const { code } = req.body ?? {};
  if (!code) return res.status(400).json({ error: "Missing code" });

  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI  = process.env.SPOTIFY_REDIRECT_URI;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type:   "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Spotify token exchange failed:", tokenData);
      return res.status(400).json({ error: "Token exchange failed", detail: tokenData });
    }

    const token   = tokenData.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Follow RADR user profile — PUT /me/following?type=user&ids=...
    // Spotify returns 204 on success
    const followUserRes = await fetch(
      `https://api.spotify.com/v1/me/following?type=user&ids=${RADR_SPOTIFY_USER_ID}`,
      { method: "PUT", headers: { ...headers, "Content-Length": "0" } }
    );

    // 3. Follow each playlist — PUT /playlists/{id}/followers
    // Spotify returns 200 or 204 on success
    const playlistResults = await Promise.all(
      PLAYLISTS.map(async ({ key, id }) => {
        const r = await fetch(`https://api.spotify.com/v1/playlists/${id}/followers`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ public: true }),
        });
        return { key, ok: r.status === 200 || r.status === 204 };
      })
    );

    const followed = {
      spotify_profile: followUserRes.status === 204,
    };
    playlistResults.forEach(({ key, ok }) => { followed[key] = ok; });

    if (!Object.values(followed).every(Boolean)) {
      console.warn("Some Spotify follows failed:", followed);
    }

    return res.json({ followed });
  } catch (err) {
    console.error("followOnSpotify error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// checkFollowsYoutube
// Exchanges the OAuth code then READS the user's subscription list.
// Google does NOT allow apps to subscribe channels on a user's behalf,
// so the user subscribes manually on YouTube first, then we verify here.
// Returns { followed: { youtube: bool } }
// ─────────────────────────────────────────────────────────────────────────────
export const checkFollowsYoutube = onRequest(async (req, res) => {
  if (cors(req, res)) return;

  const { code } = req.body ?? {};
  if (!code) return res.status(400).json({ error: "Missing code" });

  const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID;
  const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
  const REDIRECT_URI  = process.env.YOUTUBE_REDIRECT_URI;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("YouTube token exchange failed:", tokenData);
      return res.status(400).json({ error: "Token exchange failed", detail: tokenData });
    }

    // 2. Check if user is subscribed to RADR channel
    // GET /youtube/v3/subscriptions?mine=true&forChannelId=...
    // Returns items array — non-empty means subscribed
    const subRes = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${RADR_YOUTUBE_CHANNEL_ID}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const subData = await subRes.json();

    if (subData.error) {
      console.error("YouTube subscriptions API error:", subData.error);
      return res.status(400).json({ error: "YouTube API error", detail: subData.error });
    }

    const isSubscribed = Array.isArray(subData.items) && subData.items.length > 0;

    return res.json({ followed: { youtube: isSubscribed } });
  } catch (err) {
    console.error("checkFollowsYoutube error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});