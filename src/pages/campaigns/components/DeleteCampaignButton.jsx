import { useState } from "react";
import PropTypes from "prop-types";
import "../styles/delete.css";

// Deletes an unpaid campaign after a confirmation. `onDelete(id)` must throw on failure.
function DeleteCampaignButton({ campaignId, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!window.confirm("Delete this unpaid campaign? This can't be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await onDelete(campaignId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="delete-box">
      <button type="button" className="delete-btn" onClick={handleClick} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error && <div className="delete-error" role="alert">{error}</div>}
    </div>
  );
}

DeleteCampaignButton.propTypes = {
  campaignId: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default DeleteCampaignButton;
