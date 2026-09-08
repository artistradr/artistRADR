import { SUB_STATUSES } from "../constants";
import SubmissionRow from "./SubmissionRow";

export default function SubmissionsTab({ filteredSubs, loadingSubs, subFilter, setSubFilter, expanded, setExpanded, updatingStatus, deleting, updateSubmissionStatus, deleteSubmission }) {
  return (
    <>
      <div className="adm-scroll-x" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {SUB_STATUSES.map(({ value, label }) => (
          <button
            key={value}
            className="adm-filter"
            onClick={() => setSubFilter(value)}
            style={{ background: subFilter === value ? "var(--color-red)" : "transparent", borderColor: subFilter === value ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: subFilter === value ? "white" : "rgba(255,255,255,0.5)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
        {loadingSubs ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading submissions…</div>
        ) : filteredSubs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No submissions yet.</div>
        ) : (
          filteredSubs.map((sub, i) => (
            <SubmissionRow
              key={sub.id}
              sub={sub}
              isLast={i === filteredSubs.length - 1}
              expanded={expanded}
              setExpanded={setExpanded}
              isUpdating={updatingStatus === sub.id}
              deleting={deleting}
              updateSubmissionStatus={updateSubmissionStatus}
              deleteSubmission={deleteSubmission}
            />
          ))
        )}
      </div>
    </>
  );
}