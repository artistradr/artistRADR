// Single source of truth for RADR's site-wide stats.
//
// Both HomeStats.jsx and PromotionHero.jsx previously hardcoded their own,
// different numbers for overlapping claims (e.g. "200+" meant curated
// playlists on one page and artists featured on the other). Fixed in
// MIGRATION.md Section 25 — both now import from here so they can't
// contradict each other again.
//
// NOTE: these are the same figures that were already live in the code
// (HomeStats.jsx's numbers were kept as the "canonical" set). None of this
// has a confirmed data source — treat as marketing copy to be replaced with
// real analytics numbers when available, not verified facts.
//
// Suggested path: src/data/siteStats.js

export const SITE_STATS = {
  artistsDiscovered: { value: "10K+", label: "Artists Discovered" },
  monthlyListeners:  { value: "50K+", label: "Monthly Listeners" },
  curatedPlaylists:  { value: "200+", label: "Curated Playlists" },
  creatorRating:     { value: "5 ★",  label: "Creator Rating" },
};