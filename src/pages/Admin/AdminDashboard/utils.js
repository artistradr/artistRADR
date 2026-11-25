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

// Short campaign text for an approved or resolved submission.
export function campaignText(sub) {
  if (sub.status === "resolved") return "Campaign finished";
  if (sub.status !== "approved" || !sub.campaign_days) return "";
  if (!sub.campaign_started_at) return `${sub.campaign_days}-day campaign · not live yet`;
  const ms = new Date(sub.campaign_ends_at) - Date.now();
  if (ms <= 0) return `${sub.campaign_days}-day campaign · ended`;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${sub.campaign_days}-day campaign · ${days}d ${hours}h left`;
}

export function fmtDateTime(ts) {
  return ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
}