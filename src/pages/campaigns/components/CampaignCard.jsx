// One campaign in the dashboard list.
import PropTypes from "prop-types";
import { PLATFORM_META } from "./CampaignList";
import { packageName } from "../packages";
import { artistNames, safeArtwork } from "../spotifyTrack";
import { statusMeta } from "../campaignStatus";

// What happens next, in plain words.
function nextStep(c) {
  if (c.status === "pending") {
    if (c.paid === false) return "Complete payment";
    if (c.paid) return "Waiting for RADR approval";
    return "Pending";
  }
  if (c.status === "active") return "Campaign running";
  if (c.status === "paused") return "Campaign paused";
  if (c.status === "completed") return "Campaign finished";
  return "";
}

function CampaignCard({ campaign, onSelect }) {
  const platform = PLATFORM_META[campaign.platform];
  const Logo = platform?.Logo;
  const status = statusMeta(campaign.status, campaign.paid);
  const art = safeArtwork(campaign.track);
  const artists = artistNames(campaign.track);
  const covers = campaign.playlists.filter((p) => p.image).slice(0, 4);
  const count = campaign.playlists.length;
  const plan = campaign.package ? packageName(campaign.package) : "";

  return (
    <button type="button" className="campaign-card" onClick={() => onSelect(campaign.id)}>
      <span className="campaign-card-art">
        {art ? <img src={art} alt="" /> : Logo && <Logo size={28} />}
      </span>

      <span className="campaign-card-main">
        <span className="campaign-card-name">{campaign.name}</span>
        <span className="campaign-card-sub">
          {artists ? `${artists} · ` : ""}{platform?.label ?? campaign.platform}
        </span>
        <span className="campaign-card-status" style={{ color: status.color, background: status.bg }}>
          {status.label}
        </span>
      </span>

      <span className="campaign-card-price">
        <span className="campaign-card-amount">${campaign.budget.toFixed(2)}</span>
        {plan && <span className="campaign-card-plan">{plan}</span>}
      </span>

      <span className="campaign-card-foot">
        <span className="campaign-card-next">{nextStep(campaign)}</span>
        {count > 0 && (
          <span className="campaign-card-playlists">
            {covers.map((p) => (
              <img key={p.id} src={p.image} alt="" referrerPolicy="no-referrer" />
            ))}
            <span>{count} {count === 1 ? "playlist" : "playlists"}</span>
          </span>
        )}
        <span className="campaign-card-view">View →</span>
      </span>
    </button>
  );
}

CampaignCard.propTypes = { campaign: PropTypes.object.isRequired, onSelect: PropTypes.func.isRequired };

export default CampaignCard;
