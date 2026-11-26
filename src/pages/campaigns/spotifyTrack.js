// Spotify track lookup and display helpers for artist campaigns.
import { supabase } from "../../supabaseClient"; // relative: no Vite alias covers top-level src/ files

export async function searchTracks(query) {
  const { data, error } = await supabase.functions.invoke("spotify-track-search", { body: { query } });
  if (error) throw error;
  return data?.tracks ?? [];
}

// Saved track data comes from the browser, so only show Spotify-hosted images.
export function safeArtwork(track) {
  const url = track?.image;
  return typeof url === "string" && url.startsWith("https://i.scdn.co/") ? url : null;
}

// Links are built from the id, never taken from saved data.
export function spotifyUrl(track) {
  const id = track?.spotify_id;
  return /^[A-Za-z0-9]{22}$/.test(id ?? "") ? `https://open.spotify.com/track/${id}` : null;
}

export function artistNames(track) {
  return Array.isArray(track?.artists) ? track.artists.join(", ") : "";
}

export function duration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function looksLikeLink(text) {
  return /^(https?:\/\/|spotify:)/i.test(text.trim());
}
