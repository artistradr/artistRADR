import PropTypes from "prop-types";
import { money } from "./flowConfig";

function FlowSuccess({ campaign, onView, onDone }) {
  return (
    <div className="flow-card flow-success" role="status">
      <div className="flow-success-mark">✓</div>
      <h2 className="flow-title">Sent for review</h2>
      <p className="flow-sub">
        <strong>{campaign.name}</strong> ({money(campaign.budget)}) is waiting for RADR approval.
        You can follow its status on your Campaigns page.
      </p>
      <div className="flow-actions">
        <button type="button" className="flow-btn flow-btn--ghost" onClick={onDone}>All campaigns</button>
        <button type="button" className="flow-btn flow-btn--primary" onClick={onView}>View campaign</button>
      </div>
    </div>
  );
}

FlowSuccess.propTypes = {
  campaign: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default FlowSuccess;
