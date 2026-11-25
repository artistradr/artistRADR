export const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Keep this list in sync with:
//  - public.posts_category_check (DB constraint, Supabase project rjivkemajotafjvtalol)
//  - PostEditor.jsx's CATEGORIES
//  - BlogPage.jsx's CATEGORIES
export const POST_CATEGORIES = [
  { value: "all", label: "All Posts" },
  { value: "new-release", label: "New Release" },
  { value: "on-your-radr", label: "On Your RADR" },
  { value: "playlist", label: "Playlist" },
  { value: "spotlights", label: "Spotlights" },
  { value: "single", label: "Single" },
  { value: "album", label: "Album" },
  { value: "ep", label: "EP" },
  { value: "news", label: "News" },
  { value: "updates", label: "Updates" },
  { value: "trending", label: "Trending" },
];

export const SUB_STATUSES = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "resolved", label: "Resolved" },
];

export const STATUS_COLOR = {
  open: "#D94F2B",
  approved: "#22c55e",
  rejected: "#ff6b6b",
  resolved: "#8a8a8a",
};

// Duration options offered when pinning a post to a featured slot.
export const FEATURE_DURATIONS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];