// src/studio/pages/SubmissionsPage.jsx
// Playlist submissions and approvals, inside Studio. Reuses the Magazine admin's
// submissions hook and list, so statuses and the approve/reject emails behave the same.
import { useEffect } from "react";
import { supabase } from "../../supabaseClient";
import useSubmissions from "../../pages/Admin/AdminDashboard/hooks/useSubmissions";
import SubmissionsTab from "../../pages/Admin/AdminDashboard/components/SubmissionsTab";
import AdminStyles from "../../pages/Admin/AdminDashboard/components/AdminStyles";

export default function SubmissionsPage() {
  const s = useSubmissions();

  useEffect(() => {
    // Finish any campaign whose time is up, then load the list.
    supabase.rpc("studio_resolve_expired_campaigns").then(() => s.fetchSubmissions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ "--color-red": "#ff5a36", "--color-cyan": "#5ce1e6", "--font-body": '"DM Sans", system-ui, sans-serif', "--font-display": '"DM Sans", system-ui, sans-serif' }}>
      <AdminStyles />
      <h1 className="rs-h1">Submissions</h1>
      <p className="rs-sub">
        Playlist submissions from artists. Approving or rejecting a submission emails the submitter
        their outcome. Set the campaign days when you approve; the countdown starts when the song goes live
        in a RADR playlist, and the submission is resolved when it ends. Active campaigns are listed on the
        Playlists page.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span className="rs-chip next">{s.openCount} open</span>
        <span className="rs-chip live">{s.approvedCount} approved</span>
        <span className="rs-chip">{s.rejectedCount} rejected</span>
        <span className="rs-chip">{s.resolvedCount} resolved</span>
      </div>

      <SubmissionsTab
        filteredSubs={s.filteredSubs}
        loadingSubs={s.loadingSubs}
        subFilter={s.subFilter}
        setSubFilter={s.setSubFilter}
        expanded={s.expanded}
        setExpanded={s.setExpanded}
        updatingStatus={s.updatingStatus}
        deleting={s.deleting}
        updateSubmissionStatus={s.updateSubmissionStatus}
        deleteSubmission={s.deleteSubmission}
      />
    </div>
  );
}
