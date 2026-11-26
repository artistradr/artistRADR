// Playlist helpers for the campaign preview. Saved playlist data is only shown through these.

// Saved data comes from the database, so only show Spotify-hosted images.
const IMAGE_HOSTS = ["i.scdn.co", "mosaic.scdn.co"];

export function safePlaylistImage(url) {
  if (typeof url !== "string") return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return null;
    if (IMAGE_HOSTS.includes(hostname) || hostname.endsWith(".spotifycdn.com")) return url;
  } catch {
    // not a valid URL
  }
  return null;
}

// Links are built from the id, never taken from saved data.
export function playlistUrl(id) {
  return /^[A-Za-z0-9]{22}$/.test(id ?? "") ? `https://open.spotify.com/playlist/${id}` : null;
}

// campaign_playlists row -> what the preview shows.
export function rowToPlaylist(row) {
  return {
    id: row.id,
    title: row.title ?? "",
    url: playlistUrl(row.spotify_playlist_id),
    image: safePlaylistImage(row.image_url),
  };
}
