// Options and rules for the new campaign flow.
export const STEPS = ["Track", "Goal", "Budget", "Review"];

export const GOALS = [
  { value: "Curated + algorithmic playlist placement", hint: "Get your track into playlists" },
  { value: "UGC creator matching + Shorts placement", hint: "Get creators using your track in short videos" },
  { value: "Trending sound placement", hint: "Push your track as a sound people post with" },
  { value: "Radio & editorial pitching", hint: "Pitch your track to radio and editors" },
];

export const BUDGET_PRESETS = [25, 50, 100, 250];
export const MIN_BUDGET = 10;

export const INITIAL_DRAFT = { name: "", platform: "spotify", goal: GOALS[0].value, budget: "50" };

export function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount) || 0);
}

// Returns a message for the first problem on a step, or "" when it is fine.
export function stepError(step, draft) {
  if (step === 0 && !draft.name.trim()) return "Enter your track name.";
  if (step === 2) {
    const budget = Number(draft.budget);
    if (!Number.isFinite(budget) || budget < MIN_BUDGET) return `The minimum budget is ${money(MIN_BUDGET)}.`;
  }
  return "";
}
