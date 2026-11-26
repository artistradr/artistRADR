// src/studio/modules.js
import Explore from "@mui/icons-material/Explore";
import QueueMusic from "@mui/icons-material/QueueMusic";
import Inbox from "@mui/icons-material/Inbox";
import Article from "@mui/icons-material/Article";
import Dashboard from "@mui/icons-material/Dashboard";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import PhotoLibrary from "@mui/icons-material/PhotoLibrary";
import Campaign from "@mui/icons-material/Campaign";

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
    status: "live",
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
    id: "library",
    label: "Artwork library",
    path: "/studio/artwork/library",
    Icon: PhotoLibrary,
    status: "live",
    phase: "Artwork",
    tagline: "Saved Top 10 artwork, ready to download and post.",
    description:
      "Every approved Top 10 you saved, with dark and light downloads and a copy-ready caption. Staff post by hand.",
    features: [],
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
    id: "campaigns",
    label: "Campaigns",
    path: "/studio/campaigns",
    Icon: Campaign,
    status: "live",
    phase: "Artists",
    tagline: "Review artist promotion campaigns and track them to the end.",
    description:
      "Campaigns artists start on the site arrive here for review. Approve one to start its duration, then follow progress until it completes.",
    features: [],
  },
  {
    id: "magazine",
    label: "Magazine",
    path: "/studio/magazine",
    Icon: Article,
    status: "live",
    phase: "Existing",
    tagline: "Blog posts: write, edit, publish and feature.",
    description: "Your blog posts and the post editor, now inside Studio. The public site keeps its own /admin.",
    features: [],
  },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", path: "/studio", Icon: Dashboard, end: true },
  ...MODULES.map((m) => ({ id: m.id, label: m.label, path: m.path, Icon: m.Icon })),
];