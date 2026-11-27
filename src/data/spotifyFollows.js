// Single source of truth for RADR's Spotify follow targets.
//
// Both pages/Toolkit/playlist-submission/ (the OAuth follow flow) and
// EditorialPlaylists.jsx (the Promotion page) import from here instead of
// hardcoding their own copies. This is what caused the mismatch fixed in
// MIGRATION.md Section 23 — EditorialPlaylists.jsx had invented placeholder
// playlists ("Fresh Finds" / "Indie Wave" / "Underground") that didn't match
// what the app actually follows. Update playlist names/URLs here ONLY, and
// both places pick up the change automatically.
//
// Suggested path: src/data/spotifyFollows.js

export const SPOTIFY_FOLLOWS = {
  spotify_profile: {
    key: "spotify_profile",
    label: "RADR Profile",
    sub: "Official Artist Account",
    url: "https://open.spotify.com/user/31etosst62tr3hqwcdiepfw3hjk4",
  },
  spotify_new_music: {
    key: "spotify_new_music",
    label: "New Music Friday",
    sub: "Weekly Drops Playlist",
    url: "https://open.spotify.com/playlist/3Vq2POEX6IcMsPwvdG6iMv",
  },
  spotify_discoveries: {
    key: "spotify_discoveries",
    label: "RADR Discoveries",
    sub: "Emerging Artists Playlist",
    url: "https://open.spotify.com/playlist/57Gyugs4KtBVdsJZ18QY6o",
  },
  spotify_spotlight: {
    key: "spotify_spotlight",
    label: "RADR Spotlight",
    sub: "Featured Artists Playlist",
    url: "https://open.spotify.com/playlist/47z1mPJWmcVg9JgHHat8xf",
  },
};

// The 3 playlists only (excludes the RADR profile itself) — this is what
// the Promotion page's EditorialPlaylists.jsx displays.
export const SPOTIFY_PLAYLISTS = Object.values(SPOTIFY_FOLLOWS).filter(
  (f) => f.key !== "spotify_profile"
);

export const SOCIAL_FOLLOWS = {
  instagram: {
    key: "instagram",
    label: "@artistradr",
    sub: "Official RADR Instagram",
    url: "https://www.instagram.com/artistradr",
  },
  youtube: {
    key: "youtube",
    label: "@ArtistRADR",
    sub: "Official RADR Channel",
    url: "https://www.youtube.com/channel/UCm8zgufhvh8SUEVEXJk8J8Q?sub_confirmation=1",
  },
};