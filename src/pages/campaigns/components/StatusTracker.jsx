// Where a campaign is in its life: submitted, live, completed.
const STEPS = ["Submitted", "Live", "Completed"];

// Steps before this number are done; this one is current. 3 means everything is done.
// Once a campaign is submitted, "Live" is the next step; it stays current until the campaign completes.
const STAGE = { pending: 1, active: 1, paused: 1, completed: 3 };

function StatusTracker({ status }) {
  const stage = STAGE[status] ?? 1;

  return (
    <ol className="campaign-tracker" aria-label="Campaign progress">
      {STEPS.map((label, i) => {
        const state = i < stage ? "done" : i === stage ? "current" : "";
        const text = i === 1 && status === "paused" ? "Paused" : label;
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
