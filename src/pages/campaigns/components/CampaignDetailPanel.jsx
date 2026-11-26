import { PLATFORM_META } from "./CampaignList";
import { formatPlainDate, lengthLabel, packageName } from "../packages";
import { artistNames, safeArtwork, spotifyUrl } from "../spotifyTrack";

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
};

const CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

function CampaignDetailPanel({ campaign, onPause }) {
  const platform = PLATFORM_META[campaign.platform];
  const Logo = platform?.Logo;
  const art = safeArtwork(campaign.track);
  const link = spotifyUrl(campaign.track);
  const pct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0;

  return (
    <div className="campaign-detail-panel">
      {art ? (
        <img className="campaign-detail-art" src={art} alt={`Artwork for ${campaign.name}`} />
      ) : (
        <div className="campaign-detail-icon" style={{ background: platform?.color ?? "#D94F2B" }}>
          {Logo ? <Logo size={40} color="#fff" /> : null}
        </div>
      )}

      <div className="campaign-detail-name">{campaign.name}</div>
      <div className="campaign-detail-sub">
        {artistNames(campaign.track) && `${artistNames(campaign.track)} · `}
        {platform?.label ?? campaign.platform} Campaign
        {link && (
          <>
            {" · "}
            <a href={link} target="_blank" rel="noopener noreferrer">Open on Spotify</a>
          </>
        )}
      </div>

      <div className="campaign-detail-spend">${campaign.spent.toFixed(2)} <span>/ ${campaign.budget.toFixed(2)}</span></div>
      <div className="campaign-detail-progress">
        <div className="campaign-detail-progress-fill" style={{ width: `${pct}%`, background: platform?.color ?? "#D94F2B" }} />
      </div>

      <div className="campaign-detail-rows">
        <div className="campaign-detail-row">
          <span>Status</span>
          <span className="campaign-detail-row-value">{STATUS_LABEL[campaign.status] ?? campaign.status}</span>
        </div>
        {campaign.package && (
          <div className="campaign-detail-row">
            <span>Package</span>
            <span className="campaign-detail-row-value">
              {[packageName(campaign.package), campaign.package === "custom" && lengthLabel(campaign.days)]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}
        {campaign.reserveSpots && (
          <div className="campaign-detail-row">
            <span>Release-day spots</span>
            <span className="campaign-detail-row-value">Requested</span>
          </div>
        )}
        {(campaign.releaseDate || campaign.track?.release_date) && (
          <div className="campaign-detail-row">
            <span>Release date</span>
            <span className="campaign-detail-row-value">
              {campaign.releaseDate ? formatPlainDate(campaign.releaseDate) : campaign.track.release_date}
            </span>
          </div>
        )}
        <div className="campaign-detail-row">
          <span>Goal</span>
          <span className="campaign-detail-row-value">{campaign.goal}</span>
        </div>
        <div className="campaign-detail-row">
          <span>Started</span>
          <span className="campaign-detail-row-value">{campaign.startedOn}</span>
        </div>
        {/* Packages are paid once, so only older campaigns show a billing date. */}
        {!campaign.package && (
          <div className="campaign-detail-row">
            <span>Next billing</span>
            <span className="campaign-detail-row-value">{campaign.nextBilling}</span>
          </div>
        )}
        <div className="campaign-detail-row">
          <span>Payment</span>
          <span className="campaign-detail-row-value">{campaign.payment}</span>
        </div>
      </div>

      <div className="campaign-detail-actions">
        {(campaign.status === "active" || campaign.status === "paused") && (
        <button type="button" className="campaign-detail-action" onClick={onPause}>
          <span className="campaign-detail-action-left">
            {ACTION_ICONS.pause}
            {campaign.status === "paused" ? "Resume campaign" : "Pause campaign"}
          </span>
          {CHEVRON}
        </button>
        )}
      </div>
    </div>
  );
}

export default CampaignDetailPanel;