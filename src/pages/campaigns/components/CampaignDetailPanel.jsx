import { PLATFORM_META } from "./CampaignList";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const STATUS_LABEL = {
  active: "Active",
  pending: "Pending Review",
  completed: "Completed",
  paused: "Paused",
};

const ACTION_ICONS = {
  pause: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  edit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" /><path d="M3.05 13a9 9 0 106.36-11.36" /><path d="M12 7v5l4 2" />
    </svg>
  ),
  remove: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

const CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

function CampaignDetailPanel({ campaign, onPause, onRemove }) {
  const platform = PLATFORM_META[campaign.platform];
  const Logo = platform?.Logo;
  const pct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0;

  return (
    <div className="campaign-detail-panel">
      <div className="campaign-detail-icon" style={{ background: platform?.color ?? "#D94F2B" }}>
        {Logo ? <Logo size={40} color="#fff" /> : null}
      </div>

      <div className="campaign-detail-name">{campaign.name}</div>
      <div className="campaign-detail-sub">{platform?.label ?? campaign.platform} Campaign</div>

      <div className="campaign-detail-spend">${campaign.spent.toFixed(2)} <span>/ ${campaign.budget.toFixed(2)}</span></div>
      <div className="campaign-detail-progress">
        <div className="campaign-detail-progress-fill" style={{ width: `${pct}%`, background: platform?.color ?? "#D94F2B" }} />
      </div>

      <div className="campaign-detail-rows">
        <div className="campaign-detail-row">
          <span>Status</span>
          <span className="campaign-detail-row-value">{STATUS_LABEL[campaign.status] ?? campaign.status}</span>
        </div>
        <div className="campaign-detail-row">
          <span>Goal</span>
          <span className="campaign-detail-row-value">{campaign.goal}</span>
        </div>
        <div className="campaign-detail-row">
          <span>Started</span>
          <span className="campaign-detail-row-value">{campaign.startedOn}</span>
        </div>
        <div className="campaign-detail-row">
          <span>Next billing</span>
          <span className="campaign-detail-row-value">{campaign.nextBilling}</span>
        </div>
        <div className="campaign-detail-row">
          <span>Payment</span>
          <span className="campaign-detail-row-value">{campaign.payment}</span>
        </div>
      </div>

      <div className="campaign-detail-actions">
        <button type="button" className="campaign-detail-action" onClick={onPause}>
          <span className="campaign-detail-action-left">
            {ACTION_ICONS.pause}
            {campaign.status === "paused" ? "Resume campaign" : "Pause campaign"}
          </span>
          {CHEVRON}
        </button>
        <button type="button" className="campaign-detail-action">
          <span className="campaign-detail-action-left">
            {ACTION_ICONS.edit}
            Edit budget
          </span>
          {CHEVRON}
        </button>
        <button type="button" className="campaign-detail-action">
          <span className="campaign-detail-action-left">
            {ACTION_ICONS.history}
            View history
          </span>
          {CHEVRON}
        </button>
        <button type="button" className="campaign-detail-action campaign-detail-action--danger" onClick={onRemove}>
          <span className="campaign-detail-action-left">
            {ACTION_ICONS.remove}
            Remove campaign
          </span>
          {CHEVRON}
        </button>
      </div>
    </div>
  );
}

export default CampaignDetailPanel;