import { SpotifyIcon, IGIcon, YTIcon } from "./icons";

export const STEPS = [
  {
    id: "spotify", platform: "Spotify", color: "#1DB954", colorDim: "rgba(29,185,84,0.1)",
    label: "Follow on Spotify", sublabel: "Profile + 3 playlists",
    description: "Connect your Spotify account and we'll follow the RADR profile and all 3 curated playlists on your behalf — instantly, with one click. No password shared with us.",
    mode: "oauth-follow", Icon: SpotifyIcon,
    items: [
      { key: "spotify_profile",     label: "RADR Profile",     sub: "Official Artist Account" },
      { key: "spotify_new_music",   label: "New Music Friday",  sub: "Weekly Drops Playlist" },
      { key: "spotify_discoveries", label: "RADR Discoveries",  sub: "Emerging Artists Playlist" },
      { key: "spotify_spotlight",   label: "RADR Spotlight",    sub: "Featured Artists Playlist" },
    ],
  },
  {
    id: "instagram", platform: "Instagram", color: "#E1306C", colorDim: "rgba(225,48,108,0.1)",
    label: "Follow Instagram", sublabel: "@artistradr",
    description: "Follow @artistradr on Instagram to stay connected with the RADR community, editorial drops, and playlist announcements. Confirm your follow below to proceed.",
    mode: "honor", Icon: IGIcon,
    items: [{ key: "instagram", label: "@artistradr", sub: "Official RADR Instagram" }],
  },
  {
    id: "youtube", platform: "YouTube", color: "#FF0000", colorDim: "rgba(255,0,0,0.1)",
    label: "Subscribe on YouTube", sublabel: "@ArtistRADR",
    description: "First click 'Subscribe on YouTube' to open the channel and subscribe. Then click 'Verify Subscription' — we'll confirm via your Google account that you're subscribed.",
    mode: "oauth-check", Icon: YTIcon,
    items: [{ key: "youtube", label: "@ArtistRADR", sub: "Official RADR Channel" }],
  },
];
