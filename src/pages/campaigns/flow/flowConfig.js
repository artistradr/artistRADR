// Options and rules for the new campaign flow.
import { looksLikeLink } from "../spotifyTrack";
import { CUSTOM_MIN, findPackage, isFutureDate } from "../packages";

export const STEPS = ["Track", "Goal", "Package", "Review"];

export const GOALS = [
  { value: "Curated + algorithmic playlist placement", hint: "Get your track into playlists" },
  { value: "UGC creator matching + Shorts placement", hint: "Get creators using your track in short videos" },
  { value: "Trending sound placement", hint: "Push your track as a sound people post with" },
  { value: "Radio & editorial pitching", hint: "Pitch your track to radio and editors" },
];

export const INITIAL_DRAFT = {
  name: "", track: null, platform: "spotify", goal: GOALS[0].value,
  package: "", budget: "", customDays: 30, releaseDate: "", reserve: true,
};

// True once a package is chosen and has a valid price.
export function hasBudget(draft) {
  const budget = Number(draft.budget);
  if (findPackage(draft.package)) return budget === findPackage(draft.package).price;
  return Boolean(draft.package) && Number.isFinite(budget) && budget >= CUSTOM_MIN;
}

export function draftDays(draft) {
  if (draft.package === "custom") return draft.customDays;
  return findPackage(draft.package)?.days ?? null;
}

export function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount) || 0);
}

// Returns a message for the first problem on a step, or "" when it is fine.
export function stepError(step, draft) {
  if (step === 0) {
    if (!draft.name.trim()) return "Search for your song, or type its name.";
    if (!draft.track && looksLikeLink(draft.name)) return "Pick your song from the results, or type its name.";
  }
  if (step === 2) {
    if (!draft.package) return "Choose a package.";
    if (!hasBudget(draft)) return `Enter a budget of at least ${money(CUSTOM_MIN)}.`;
    if (draft.package === "presave" && !isFutureDate(draft.releaseDate)) return "Choose a release date after today.";
  }
  return "";
}
