// Where a campaign is in its life: submitted, in review, live, completed.
const STEPS = ["Submitted", "In review", "Live", "Completed"];

// Steps before this number are done; this one is current. 4 means everything is done.
const STAGE = { pending: 1, active: 2, paused: 2, completed: 4 };

function StatusTracker({ status }) {
  const stage = STAGE[status] ?? 1;

  return (
    <ol className="campaign-tracker" aria-label="Campaign progress">
      {STEPS.map((label, i) => {
        const state = i < stage ? "done" : i === stage ? "current" : "";
        const text = i === 2 && status === "paused" ? "Paused" : label;
        return (
          <li
            key={label}
            className={`campaign-tracker-step${state ? ` campaign-tracker-step--${state}` : ""}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            {text}
          </li>
        );
      })}
    </ol>
  );
}

export default StatusTracker;
