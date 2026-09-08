// A post counts as actively featured only while featured_until is in the
// future. A stale featured_slot with a past featured_until is treated as
// not featured — the blog page applies the same rule when picking who shows
// in the top-3 strip.
export function isActivelyFeatured(post) {
  return Boolean(post.featured_slot) && Boolean(post.featured_until) && new Date(post.featured_until) > new Date();
}

// Supabase returns plain ISO timestamp strings, not Firestore Timestamp
// objects — no .toDate() call needed/available here.
export function fmtDate(ts) {
  return ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export function fmtDateTime(ts) {
  return ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
}