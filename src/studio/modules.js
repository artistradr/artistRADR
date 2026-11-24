// src/studio/modules.js
import Explore from "@mui/icons-material/Explore";
import QueueMusic from "@mui/icons-material/QueueMusic";
import Palette from "@mui/icons-material/Palette";
import Send from "@mui/icons-material/Send";
import Mic from "@mui/icons-material/Mic";
import Article from "@mui/icons-material/Article";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Dashboard from "@mui/icons-material/Dashboard";

// status: "live" | "next" | "planned"
export const MODULES = [
  {
    id: "discovery",
    label: "Discovery",
    path: "/studio/discovery",
    Icon: Explore,
    status: "live",
    phase: "Phase 3",
    tagline: "Find emerging artists and promising tracks, early.",
    description:
      "Scan configured sources, rank candidates using verifiable signals, and review them. You accept, reject or save each track. Acceptance never publishes anything on its own.",
    features: [
      "Configurable discovery sources (add, disable, categorise)",
      "Candidate review list with country, genre and release filters",
      "Signals recorded with source and observation date",
      "Accept / reject / save for later / add to playlist",
      "Discovery history across repeated scans",
    ],
  },
  {
    id: "playlists",
    label: "Playlists",
    path: "/studio/playlists",
    Icon: QueueMusic,
    status: "next",
    phase: "Phase 2",
    tagline: "Curate RADR playlists on Spotify and Apple Music.",
    description:
      "Build a draft playlist from accepted discoveries and manual picks, reorder it, preview every change, then sync only after you approve.",
    features: [
      "Spotify connection (server-side tokens)",
      "RADR playlist records and live playlist view",
      "Search and manual track selection",
      "Cross-platform track matching with manual review",
      "Drag-and-drop draft ordering",
      "Change preview: adds, removes, reorders, conflicts",
      "Approved sync with logs",
    ],
  },
  {
    id: "studio",
    label: "Studio",
    path: "/studio/create",
    Icon: Palette,
    status: "planned",
    phase: "Phase 4",
    tagline: "Turn discoveries into branded artwork and copy.",
    description:
      "Templates and assets for artist spotlights, RADR Selections and playlist promos, in the aspect ratios each social platform needs.",
    features: [
      "Reusable RADR artwork templates",
      "Artist Spotlight and RADR Selection formats",
      "Approved asset library with credit and rights fields",
      "Captions and headline drafting",
      "Draft, review and approved states",
    ],
  },
  {
    id: "publishing",
    label: "Publishing",
    path: "/studio/publishing",
    Icon: Send,
    status: "planned",
    phase: "Phase 5",
    tagline: "Approve, schedule and track social posts through Buffer.",
    description:
      "Per-channel previews, an approval step, and status tracking from draft to published.",
    features: [
      "Buffer connection and channel list",
      "Platform-specific previews and limits",
      "Draft → needs review → approved → scheduled → published",
      "Error display and safe retries",
    ],
  },
  {
    id: "originals",
    label: "Originals",
    path: "/studio/originals",
    Icon: Mic,
    status: "planned",
    phase: "Phase 8",
    tagline: "Interviews, sessions and podcast episodes.",
    description:
      "A home for RADR Interviews, RADR Sessions and the RADR Podcast, with episode pages on artistradr.com.",
    features: [
      "Series and episode records",
      "Video and audio references, cover art, transcripts",
      "Guest and contributor profiles",
      "Draft, review, scheduled and published states",
    ],
  },
  {
    id: "magazine",
    label: "Magazine",
    path: "/admin",
    Icon: Article,
    status: "live",
    phase: "Existing",
    tagline: "Your current post editor and submissions dashboard.",
    description: "Opens the existing admin: posts, editor and submissions.",
    features: [],
  },
  {
    id: "ai",
    label: "RADR AI",
    path: "/studio/ai",
    Icon: AutoAwesome,
    status: "planned",
    phase: "Phase 6",
    tagline: "An assistant that works through scoped, auditable tools.",
    description:
      "Discover, Prepare and Execute permission levels, with explicit approval before anything goes live.",
    features: [
      "Provider-independent tool layer",
      "Discovery, playlist, Studio and Buffer tools",
      "Approval gates and action summaries",
      "Activity history",
    ],
  },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", path: "/studio", Icon: Dashboard, end: true },
  ...MODULES.map((m) => ({ id: m.id, label: m.label, path: m.path, Icon: m.Icon })),
];