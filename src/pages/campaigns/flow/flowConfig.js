// Options and rules for the new campaign flow.
import { looksLikeLink } from "../spotifyTrack";
import { PRESAVE, SUPERCHARGE, findPackage, isFutureDate, isSuperchargeAmount } from "../packages";

export const STEPS = ["Track", "Goal", "Package", "Review"];

export const GOALS = [
  { value: "Curated + algorithmic playlist placement", hint: "Get your track into playlists" },
  { value: "UGC creator matching + Shorts placement", hint: "Get creators using your track in short videos" },
  { value: "Trending sound placement", hint: "Push your track as a sound people post with" },
  { value: "Radio & editorial pitching", hint: "Pitch your track to radio and editors" },
];

export const INITIAL_DRAFT = {
  name: "", track: null, platform: "spotify", goal: GOALS[0].value,
  package: "", budget: "", releaseDate: "", reserve: true,
};

// Starting point for renewing a finished campaign: same song, goal and platform.
// The package, price and release date are chosen again.
export function renewDraft(campaign) {
  const goal = GOALS.some((g) => g.value === campaign.goal) ? campaign.goal : INITIAL_DRAFT.goal;
  return {
    ...INITIAL_DRAFT,
    name: campaign.name ?? "",
    track: campaign.track ?? null,
    platform: campaign.platform || INITIAL_DRAFT.platform,
    goal,
  };
}

// True once a package is chosen and has a valid price.
export function hasBudget(draft) {
  const budget = Number(draft.budget);
  if (draft.package === SUPERCHARGE.id) return isSuperchargeAmount(draft.budget);
  if (draft.package === PRESAVE.id) return Number.isFinite(budget) && budget >= PRESAVE.min;
  const fixed = findPackage(draft.package);
  return Boolean(fixed) && budget === fixed.price;
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
    if (!hasBudget(draft)) {
      return draft.package === SUPERCHARGE.id
        ? `Enter a whole dollar amount from $${SUPERCHARGE.min} to $${SUPERCHARGE.max}.`
        : `Enter a budget of at least ${money(PRESAVE.min)}.`;
    }
    if (draft.package === "presave" && !isFutureDate(draft.releaseDate)) return "Choose a release date after today.";
  }
  return "";
}
