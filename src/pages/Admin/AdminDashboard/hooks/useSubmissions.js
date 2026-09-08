import { useState } from "react";
import { supabase } from "../../../../supabaseClient";

export default function useSubmissions() {
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subFilter, setSubFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    const { data, error } = await supabase.from("playlist_submissions").select("*").order("submitted_at", { ascending: false });
    if (error) console.error(error);
    else setSubs(data);
    setLoadingSubs(false);
  };

  // Setting status to "approved" or "rejected" fires the Supabase trigger
  // (on_submission_status_notify) which emails the submitter their outcome
  // via Resend. Setting it back to "open" does NOT re-fire that email —
  // it's a plain status revert for correcting a mis-click.
  const updateSubmissionStatus = async (id, status) => {
    setUpdatingStatus(id);
    const { error } = await supabase.from("playlist_submissions").update({ status }).eq("id", id);
    if (error) {
      console.error(error);
      window.alert("Couldn't update status — check console for details.");
      setUpdatingStatus(null);
      return;
    }
    setSubs((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    setUpdatingStatus(null);
  };

  const deleteSubmission = async (id) => {
    if (!window.confirm("Delete this submission permanently?")) return;
    setDeleting(id);
    const { error } = await supabase.from("playlist_submissions").delete().eq("id", id);
    if (error) console.error(error);
    else setSubs((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const filteredSubs = subFilter === "all" ? subs : subs.filter((s) => s.status === subFilter);
  const openCount = subs.filter((s) => s.status === "open").length;
  const approvedCount = subs.filter((s) => s.status === "approved").length;
  const rejectedCount = subs.filter((s) => s.status === "rejected").length;

  return {
    subs, loadingSubs, subFilter, setSubFilter, deleting, updatingStatus, expanded, setExpanded,
    filteredSubs, openCount, approvedCount, rejectedCount,
    fetchSubmissions, updateSubmissionStatus, deleteSubmission,
  };
}