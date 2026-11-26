// Where a campaign is in its life: running, completed.
const STEPS = ["Running", "Completed"];

// Steps before this number are done; this one is current. 2 means everything is done.
// A campaign counts as running from the moment it is sent, until it completes.
const STAGE = { pending: 0, active: 0, paused: 0, completed: 2 };

function StatusTracker({ status }) {
  const stage = STAGE[status] ?? 0;

  return (
    <ol className="campaign-tracker" aria-label="Campaign progress">
      {STEPS.map((label, i) => {
        const state = i < stage ? "done" : i === stage ? "current" : "";
        return (
          <li
            key={label}
            className={`campaign-tracker-step${state ? ` campaign-tracker-step--${state}` : ""}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export default StatusTracker;
