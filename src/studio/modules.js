// src/studio/modules.js
import Explore from "@mui/icons-material/Explore";
import QueueMusic from "@mui/icons-material/QueueMusic";
import Palette from "@mui/icons-material/Palette";
import Send from "@mui/icons-material/Send";
import Inbox from "@mui/icons-material/Inbox";
import Article from "@mui/icons-material/Article";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Dashboard from "@mui/icons-material/Dashboard";
import EmojiEvents from "@mui/icons-material/EmojiEvents";

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
    id: "top10",
    label: "Top 10 Generator",
    path: "/studio/artwork/top10",
    Icon: EmojiEvents,
    status: "live",
    phase: "Artwork",
    tagline: "Weekly, monthly and random Top 10 artwork from your playlists.",
    description:
      "Load 10 tracks from a RADR playlist, edit the title line and date, swap covers, approve, then download the 1080x1350 image.",
    features: [],
  },
  {
    id: "publishing",
    label: "Publishing",
    path: "/studio/publishing",
    Icon: Send,
    status: "planned",
    phase: "Phase 5",
    tagline: "Approved artwork and captions, posted manually by staff for now.",
    description:
      "A place for approved artwork and captions. Staff post to each platform by hand and record where and when.",
    features: [
      "Approved artwork ready to download",
      "Copy-ready captions and hashtags",
      "Mark as posted by staff, with channel and date",
    ],
  },
  {
    id: "submissions",
    label: "Submissions",
    path: "/studio/submissions",
    Icon: Inbox,
    status: "live",
    phase: "Existing",
    tagline: "Review playlist submissions, then approve or reject them.",
    description:
      "The playlist submissions from the Magazine admin, now inside Studio. Approving or rejecting emails the submitter their outcome.",
    features: [],
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
      "Discovery, playlist and Studio tools",
      "Approval gates and action summaries",
      "Activity history",
    ],
  },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", path: "/studio", Icon: Dashboard, end: true },
  ...MODULES.map((m) => ({ id: m.id, label: m.label, path: m.path, Icon: m.Icon })),
];