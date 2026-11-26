// src/studio/components/campaignSong.js
//
// Small helpers that turn a campaigns row into the song title, artist line and artwork the
// Studio campaign playlist screens show. Artwork is shown only when it is Spotify-hosted.

const SPOTIFY_IMAGE = /^https:\/\/i\.scdn\.co\//;

export const songTitle = (c) => c.spotify_track?.name || c.name || "Untitled campaign";

export function songArtist(c) {
  const artists = c.spotify_track?.artists;
  if (Array.isArray(artists) && artists.length) return artists.join(", ");
  return c.artist_name || "";
}

export function songImage(c) {
  const url = c.spotify_track?.image;
  return typeof url === "string" && SPOTIFY_IMAGE.test(url) ? url : "";
}

// Campaign status -> chip label and tone (tones are the .rs-chip classes in studio.css).
export const CAMPAIGN_CHIP = {
  pending: { label: "Needs review", tone: "warn" },
  active: { label: "Running", tone: "live" },
  paused: { label: "Paused", tone: "next" },
  completed: { label: "Completed", tone: "" },
};
