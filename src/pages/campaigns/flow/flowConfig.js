// Options and rules for the new campaign flow.
import { looksLikeLink } from "../spotifyTrack";
import { DAILY, PRESAVE, SUPERCHARGE, dailyTotal, isDailyPlan, isFutureDate, isSuperchargeAmount } from "../packages";
import { canPay } from "../currency";

export const STEPS = ["Track", "Goal", "Package", "Review", "Payment"];

export const GOALS = [
  { value: "Curated + algorithmic playlist placement", hint: "Get your track into playlists" },
  { value: "UGC creator matching + Shorts placement", hint: "Get creators using your track in short videos" },
  { value: "Trending sound placement", hint: "Push your track as a sound people post with" },
  { value: "Radio & editorial pitching", hint: "Pitch your track to radio and editors" },
];

export const INITIAL_DRAFT = {
  name: "", track: null, platform: "spotify", goal: GOALS[0].value,
  package: "", budget: "", releaseDate: "", reserve: true,
  dailyRate: "", days: "", extraTrack: null,
  method: "", // payment method: "paystack" (Flutterwave is coming soon)
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

// True once a plan is chosen and has a valid price.
export function hasBudget(draft) {
  const budget = Number(draft.budget);
  if (draft.package === DAILY.id) {
    return isDailyPlan(draft.dailyRate, draft.days) && budget === dailyTotal(draft.dailyRate, draft.days);
  }
  if (draft.package === SUPERCHARGE.id) return isSuperchargeAmount(draft.budget);
  if (draft.package === PRESAVE.id) return Number.isFinite(budget) && budget >= PRESAVE.min;
  return false;
}

export function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount) || 0);
}

// Returns a message for the first problem on a step, or "" when it is fine.
// `currency` is the artist's chosen currency, needed to check the payment step.
export function stepError(step, draft, currency = "USD") {
  if (step === 0) {
    if (!draft.name.trim()) return "Search for your song, or type its name.";
    if (!draft.track && looksLikeLink(draft.name)) return "Pick your song from the results, or type its name.";
  }
  if (step === 2) {
    if (!draft.package) return "Choose a plan.";
    if (!hasBudget(draft)) {
      if (draft.package === DAILY.id) {
        return `Choose a daily spend from ${money(DAILY.minRate)} to ${money(DAILY.maxRate)} and ${DAILY.minDays} to ${DAILY.maxDays} days.`;
      }
      return draft.package === SUPERCHARGE.id
        ? `Enter a whole dollar amount from $${SUPERCHARGE.min} to $${SUPERCHARGE.max}.`
        : `Enter a budget of at least ${money(PRESAVE.min)}.`;
    }
    if (draft.package === "presave" && !isFutureDate(draft.releaseDate)) return "Choose a release date after today.";
  }
  if (step === 4 && !canPay(draft, currency)) {
    return currency === "USD"
      ? "Paying in USD isn't available yet. Choose Paystack to pay in Naira."
      : "Choose a payment method.";
  }
  return "";
}
