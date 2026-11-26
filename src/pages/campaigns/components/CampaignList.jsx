import { SpotifyLogo, AppleMusicLogo, YoutubeLogo, TikTokLogo } from "components/PlatformLogos";
import { safeArtwork } from "../spotifyTrack";
import { statusMeta } from "../campaignStatus";

export const PLATFORM_META = {
  spotify: { Logo: SpotifyLogo, label: "Spotify", color: "#1DB954" },
  appleMusic: { Logo: AppleMusicLogo, label: "Apple Music", color: "#FA243C" },
  youtube: { Logo: YoutubeLogo, label: "YouTube", color: "#FF0000" },
  tiktok: { Logo: TikTokLogo, label: "TikTok", color: "#000000" },
};

function CampaignList({ campaigns, selectedId, onSelect }) {
  if (!campaigns.length) {
    return (
      <div className="campaign-list-empty">
        <div className="campaign-list-empty-title">No campaigns yet</div>
        <div className="campaign-list-empty-sub">Start your first campaign to get your music in front of the right audiences.</div>
      </div>
    );
  }

  return (
    <div className="campaign-list">
      {campaigns.map((campaign) => {
        const platform = PLATFORM_META[campaign.platform];
        const status = statusMeta(campaign.status, campaign.paid);
        const Logo = platform?.Logo;
        const isSelected = campaign.id === selectedId;

        return (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onSelect(campaign.id)}
            className={`campaign-list-row${isSelected ? " campaign-list-row--active" : ""}`}
          >
            <div className="campaign-list-row-icon">
              {safeArtwork(campaign.track) ? (
                <img className="campaign-artwork" src={safeArtwork(campaign.track)} alt="" />
              ) : (
                Logo && <Logo size={22} />
              )}
            </div>

            <div className="campaign-list-row-main">
              <div className="campaign-list-row-name">{campaign.name}</div>
              <div className="campaign-list-row-sub">{platform?.label ?? campaign.platform} · {campaign.goal}</div>
            </div>

            <div className="campaign-list-row-meta">
              <span className="campaign-list-status" style={{ color: status.color, background: status.bg }}>
                {status.label}
              </span>
              <span className="campaign-list-row-budget">${campaign.budget.toFixed(2)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default CampaignList;
