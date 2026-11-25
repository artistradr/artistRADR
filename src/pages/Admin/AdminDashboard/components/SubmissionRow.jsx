import { F, STATUS_COLOR } from "../constants";
import { fmtDate, campaignText } from "../utils";
import SubActions from "./SubActions";

export default function SubmissionRow({ sub, isLast, expanded, setExpanded, isUpdating, deleting, updateSubmissionStatus, deleteSubmission }) {
  // All submission-form fields live inside the jsonb `payload` column, not
  // as top-level table columns — see MIGRATION.md Section 2.
  const p = sub.payload || {};
  const statusColor = STATUS_COLOR[sub.status] || STATUS_COLOR.open;
  const isOpen = expanded === sub.id;
  const toggle = () => setExpanded(isOpen ? null : sub.id);

  return (
    <div>
      <div className="adm-sub-row" style={{ padding: "16px 24px", borderBottom: isOpen || !isLast ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
        {/* Desktop: single row */}
        <div className="adm-desktop-only" style={{ alignItems: "center", gap: "16px", cursor: "pointer" }} onClick={toggle}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "white", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.artistName} — <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{p.trackName}</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(sub.submitted_at)}</span>
              {campaignText(sub) && <span style={{ fontSize: "11px", color: "#22c55e" }}>{campaignText(sub)}</span>}
              {p.genre && <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: "rgba(77,217,208,0.1)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.2)" }}>{p.genre}</span>}
            </div>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${statusColor}1a`, color: statusColor, border: `0.5px solid ${statusColor}40`, flexShrink: 0 }}>
            {sub.status}
          </span>
          <SubActions sub={sub} isUpdating={isUpdating} deleting={deleting} updateSubmissionStatus={updateSubmissionStatus} deleteSubmission={deleteSubmission} />
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", transition: "transform 200ms", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
        </div>

        {/* Mobile: stacked card */}
        <div className="adm-mobile-only" style={{ flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }} onClick={toggle}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0, marginTop: "5px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.d, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "white", marginBottom: "5px" }}>
                {p.artistName} — <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{p.trackName}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(sub.submitted_at)}</span>
                {campaignText(sub) && <span style={{ fontSize: "10.5px", color: "#22c55e" }}>{campaignText(sub)}</span>}
                {p.genre && <span style={{ fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "100px", background: "rgba(77,217,208,0.1)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.2)" }}>{p.genre}</span>}
                <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: `${statusColor}1a`, color: statusColor, border: `0.5px solid ${statusColor}40` }}>
                  {sub.status}
                </span>
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", flexShrink: 0, marginTop: "4px", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
          </div>
          <SubActions sub={sub} isUpdating={isUpdating} deleting={deleting} updateSubmissionStatus={updateSubmissionStatus} deleteSubmission={deleteSubmission} stacked />
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: "20px 24px 24px 28px", borderBottom: isLast ? "none" : "0.5px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Artist", val: p.artistName },
              { label: "Track", val: p.trackName },
              { label: "Genre", val: p.genre || "—" },
              { label: "Email", val: p.email },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "13px", color: "white", fontWeight: 500, wordBreak: "break-word" }}>{val}</div>
              </div>
            ))}
          </div>
          {p.spotifyLink && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Spotify Link</div>
              <a href={p.spotifyLink} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1DB954", textDecoration: "none", fontWeight: 500, wordBreak: "break-all" }}>{p.spotifyLink}</a>
            </div>
          )}
          {p.notes && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Notes</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{p.notes}</div>
            </div>
          )}
          {p.optionalFollows?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>Also follows</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {p.optionalFollows.map((f) => (
                  <span key={f} style={{ fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "100px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "0.5px solid rgba(255,255,255,0.1)" }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}