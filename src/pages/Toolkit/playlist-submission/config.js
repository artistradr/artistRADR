export const FUNCTIONS_BASE = "https://rjivkemajotafjvtalol.supabase.co/functions/v1";
export const API = {
  spotify: `${FUNCTIONS_BASE}/follow-on-spotify`,
  youtube: `${FUNCTIONS_BASE}/check-follows-youtube`,
};

export const SPOTIFY_CLIENT_ID = "6434dcc723df4a759edd60afbd2f388c";
export const SPOTIFY_SCOPES = "user-follow-modify playlist-modify-public playlist-modify-private";

export const YOUTUBE_CLIENT_ID = "148558438217-0essbua3gsliuhjt8sbjaho2v8vg4nsn.apps.googleusercontent.com";

const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const SPOTIFY_REDIRECT = IS_LOCAL
  ? "http://127.0.0.1:5173/auth/spotify/callback"
  : "https://artistradr.com/auth/spotify/callback";
export const YOUTUBE_REDIRECT = IS_LOCAL
  ? "http://127.0.0.1:5173/auth/youtube/callback"
  : "https://artistradr.com/auth/youtube/callback";

export const FOLLOWS = {
  spotify_profile:     { url: "https://open.spotify.com/user/31etosst62tr3hqwcdiepfw3hjk4" },
  spotify_new_music:   { url: "https://open.spotify.com/playlist/3Vq2POEX6IcMsPwvdG6iMv" },
  spotify_discoveries: { url: "https://open.spotify.com/playlist/57Gyugs4KtBVdsJZ18QY6o" },
  spotify_spotlight:   { url: "https://open.spotify.com/playlist/47z1mPJWmcVg9JgHHat8xf" },
  instagram:           { url: "https://www.instagram.com/artistradr" },
  youtube:             { url: "https://www.youtube.com/channel/UCm8zgufhvh8SUEVEXJk8J8Q?sub_confirmation=1" },
};

export const OPTIONAL = [
  { id: "twitter",  label: "X / Twitter", url: "https://twitter.com/artistradr" },
  { id: "tiktok",   label: "TikTok",      url: "https://tiktok.com/@artistradr" },
  { id: "facebook", label: "Facebook",    url: "https://facebook.com/artistradr" },
];
