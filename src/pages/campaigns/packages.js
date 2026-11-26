// Campaign packages: the one place to change prices, lengths and wording.
// Prices are per campaign, in USD. The database enforces the same prices and
// lengths (see the campaigns_packages migration), so change both together.
// Playlist, listener and stream figures are targets, never guarantees.

export const CUSTOM_MIN = 50;
export const CUSTOM_LENGTHS = [
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
  { days: 60, label: "2 months" },
];

export const PACKAGES = [
  {
    id: "weekly", name: "1 Week", price: 25, days: 7, length: "1 week",
    targets: ["2–3 playlists", "2K–3K est. streams from active listeners"],
  },
  {
    id: "two_weeks", name: "2 Weeks", price: 50, days: 14, length: "2 weeks", recommended: true,
    targets: ["1 Top 10 playlist", "3–5 playlists", "3K–6K est. active listener growth"],
  },
  {
    id: "monthly", name: "1 Month", price: 100, days: 30, length: "1 month",
    targets: ["6+ playlists", "10K+ est. active listeners", "10K+ est. streams"],
  },
];

export const FLEXIBLE = [
  { id: "custom", name: "Custom", hint: "Choose your own budget and length" },
  { id: "presave", name: "Pre-save", hint: "For an upcoming release, with release-day playlist spots" },
];

export const DISCLAIMER =
  "Playlist, listener and stream numbers are targets, not guarantees. Playlist curators decide placements.";

export function findPackage(id) {
  return PACKAGES.find((p) => p.id === id) ?? null;
}

export function packageName(id) {
  return findPackage(id)?.name ?? FLEXIBLE.find((p) => p.id === id)?.name ?? "";
}

export function lengthLabel(days) {
  if (!days) return "";
  return CUSTOM_LENGTHS.find((l) => l.days === days)?.label ?? `${days} days`;
}

// "YYYY-MM-DD" for the visitor's own calendar, offset by a number of days.
export function localDate(offsetDays = 0, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isFutureDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") && value >= localDate(1);
}

// Show a plain date without letting the time zone move it to another day.
export function formatPlainDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
