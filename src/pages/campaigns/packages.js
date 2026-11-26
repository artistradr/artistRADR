// Campaign packages: the one place to change prices, targets and wording.
// Prices are per campaign, in USD. The database enforces the same prices and
// limits (see the campaigns_supercharge migration), so change both together.
// Playlist, listener and stream figures are targets, never guarantees.

export const PACKAGES = [
  {
    id: "starter", name: "Starter", price: 25,
    targets: ["2–3 playlists", "2K–3K est. streams from active listeners"],
  },
  {
    id: "basic", name: "Basic", price: 50, recommended: true,
    targets: ["1 Top 10 playlist", "3–5 playlists", "3K–6K est. active listener growth"],
  },
];

export const SUPERCHARGE = { id: "supercharge", name: "Supercharge", min: 100, max: 999, addSteps: [25, 50, 100] };

// Targets rise in steps, and more slowly than the price. An amount between two
// steps gets the lower step, so targets are never rounded up.
export const SUPERCHARGE_TIERS = [
  { from: 100, top10: 3, playlists: 6, listeners: 10 },
  { from: 200, top10: 4, playlists: 9, listeners: 16 },
  { from: 300, top10: 5, playlists: 11, listeners: 22 },
  { from: 500, top10: 6, playlists: 15, listeners: 32 },
  { from: 750, top10: 7, playlists: 19, listeners: 44 },
  { from: 999, top10: 8, playlists: 22, listeners: 55 },
];

export const PRESAVE = {
  id: "presave", name: "Pre-save", min: 50,
  hint: "For an upcoming release, with release-day playlist spots",
};

export const DISCLAIMER =
  "Playlist, listener and stream numbers are targets, not guarantees. Playlist curators decide placements.";

export function findPackage(id) {
  return PACKAGES.find((p) => p.id === id) ?? null;
}

export function packageName(id) {
  return [...PACKAGES, SUPERCHARGE, PRESAVE].find((p) => p.id === id)?.name ?? "";
}

export function isSuperchargeAmount(value) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= SUPERCHARGE.min && amount <= SUPERCHARGE.max;
}

export function superchargeTargets(amount) {
  const tier = SUPERCHARGE_TIERS.findLast((t) => Number(amount) >= t.from);
  if (!tier) return [];
  return [
    `${tier.top10} Top 10 playlists`,
    `${tier.playlists}+ playlists`,
    `${tier.listeners}K+ est. active listener growth`,
  ];
}

// The amount at which the targets next go up, or null at the highest step.
export function nextTierAt(amount) {
  return SUPERCHARGE_TIERS.find((t) => t.from > Number(amount))?.from ?? null;
}

export function targetsFor(id, budget) {
  if (id === SUPERCHARGE.id) return superchargeTargets(budget);
  return findPackage(id)?.targets ?? [];
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
