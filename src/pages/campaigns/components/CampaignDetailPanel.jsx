import { PLATFORM_META } from "./CampaignList";
import PayButton from "./PayButton";
import PlaylistCovers from "./PlaylistCovers";
import StatusTracker from "./StatusTracker";
import { formatPlainDate, packageName } from "../packages";
import { artistNames, safeArtwork, spotifyUrl } from "../spotifyTrack";

const STATUS_META = {
  active: { label: "Active", color: "#1DB954", bg: "rgba(29,185,84,0.1)" },
  pending: { label: "Pending Review", color: "#D9A02B", bg: "rgba(217,160,43,0.12)" },
  completed: { label: "Completed", color: "#888", bg: "rgba(0,0,0,0.05)" },
  paused: { label: "Paused", color: "#D94F2B", bg: "rgba(217,79,43,0.1)" },
};

const RENEW_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

function Row({ label, children }) {
  return (
    <div className="campaign-detail-row">
      <span>{label}</span>
      <span className="campaign-detail-row-value">{children}</span>
    </div>
  );
}

function CampaignDetailPanel({ campaign, onRenew }) {
  const platform = PLATFORM_META[campaign.platform];
  const Logo = platform?.Logo;
  const status = STATUS_META[campaign.status] ?? STATUS_META.pending;
  const art = safeArtwork(campaign.track);
  const link = spotifyUrl(campaign.track);
  const artists = artistNames(campaign.track);
  const releaseDate = campaign.releaseDate ? formatPlainDate(campaign.releaseDate) : campaign.track?.release_date;

  return (
    <div className="campaign-detail-panel">
      <div className="campaign-detail-hero">
        {art ? (
          <img className="campaign-detail-art" src={art} alt={`Artwork for ${campaign.name}`} />
        ) : (
          <div className="campaign-detail-icon" style={{ background: platform?.color ?? "#D94F2B" }}>
            {Logo ? <Logo size={36} color="#fff" /> : null}
          </div>
        )}

        <div className="campaign-detail-heading">
          <div className="campaign-detail-name">{campaign.name}</div>
          <div className="campaign-detail-sub">
            {artists && `${artists} · `}
            {platform?.label ?? campaign.platform} Campaign
            {link && (
              <>
                {" · "}
                <a href={link} target="_blank" rel="noopener noreferrer">Open on Spotify</a>
              </>
            )}
          </div>
          <div className="campaign-detail-chips">
            <span className="campaign-detail-chip" style={{ color: status.color, background: status.bg }}>
              {status.label}
            </span>
            {campaign.package && <span className="campaign-detail-chip">{packageName(campaign.package)}</span>}
          </div>
        </div>
      </div>

      <StatusTracker status={campaign.status} />
      <PlaylistCovers playlists={campaign.playlists} status={campaign.status} />

      <div className="campaign-detail-rows">
        {campaign.package ? (
          <Row label="Package">{packageName(campaign.package)} · {money(campaign.budget)}</Row>
        ) : (
          <Row label="Budget">{money(campaign.budget)}</Row>
        )}
        {campaign.reserveSpots && <Row label="Release-day spots">Requested</Row>}
        {releaseDate && <Row label="Release date">{releaseDate}</Row>}
        <Row label="Goal">{campaign.goal}</Row>
        <Row label={campaign.status === "pending" ? "Submitted" : "Started"}>{campaign.startedOn}</Row>
        {/* Packages are paid once, so only older campaigns show a billing date. */}
        {!campaign.package && <Row label="Next billing">{campaign.nextBilling}</Row>}
        <Row label="Payment">{campaign.paid ? "Paid" : campaign.status === "pending" ? "Not paid" : campaign.payment}</Row>
      </div>

      {campaign.status === "pending" && !campaign.paid && campaign.budget > 0 && (
        <PayButton campaignId={campaign.id} />
      )}

      {/* Shown only once the campaign is over. */}
      {campaign.status === "completed" && (
        <div className="campaign-detail-actions">
          <button type="button" className="campaign-detail-action" onClick={onRenew}>
            <span className="campaign-detail-action-left">
              {RENEW_ICON}
              Renew campaign
            </span>
            {CHEVRON}
          </button>
        </div>
      )}
    </div>
  );
}

export default CampaignDetailPanel;
