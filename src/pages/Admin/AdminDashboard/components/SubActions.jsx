import { F } from "../constants";

export default function SubActions({ sub, isUpdating, deleting, updateSubmissionStatus, deleteSubmission, stacked }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexShrink: 0, ...(stacked ? { width: "100%" } : {}) }} onClick={(e) => e.stopPropagation()}>
      {sub.status === "open" ? (
        <>
          <button
            onClick={() => updateSubmissionStatus(sub.id, "approved")}
            disabled={isUpdating}
            style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.25)", color: "#22c55e", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}
          >
            {isUpdating ? "…" : "Approve"}
          </button>
          <button
            onClick={() => updateSubmissionStatus(sub.id, "rejected")}
            disabled={isUpdating}
            style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,80,80,0.08)", border: "0.5px solid rgba(255,80,80,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}
          >
            {isUpdating ? "…" : "Reject"}
          </button>
        </>
      ) : (
        <button
          onClick={() => updateSubmissionStatus(sub.id, "open")}
          disabled={isUpdating}
          title="Revert to open — does not send another email"
          style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}
        >
          {isUpdating ? "…" : "Reopen"}
        </button>
      )}
      <button
        onClick={() => deleteSubmission(sub.id)}
        disabled={deleting === sub.id}
        style={{ flex: "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,50,50,0.08)", border: "0.5px solid rgba(255,50,50,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: deleting === sub.id ? 0.5 : 1 }}
      >
        {deleting === sub.id ? "…" : "Delete"}
      </button>
    </div>
  );
}