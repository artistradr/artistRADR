// Where a campaign is in its life: running, completed. Drawn as a slim timeline.
const STEPS = ["Running", "Completed"];

// Steps before this number are done; this one is current. 2 means everything is done.
// A campaign counts as running from the moment it is sent, until it completes.
const STAGE = { pending: 0, active: 0, paused: 0, completed: 2 };

const CHECK = (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
            <span className="campaign-tracker-dot">{state === "done" ? CHECK : null}</span>
            <span className="campaign-tracker-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default StatusTracker;
