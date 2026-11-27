import { useState } from "react";
import PropTypes from "prop-types";
import { SpotifyLogo, AppleMusicLogo, YoutubeLogo, TikTokLogo } from "components/PlatformLogos";
import CampaignCard from "./CampaignCard";
import { FILTERS } from "../filters";

export const PLATFORM_META = {
  spotify: { Logo: SpotifyLogo, label: "Spotify", color: "#1DB954" },
  appleMusic: { Logo: AppleMusicLogo, label: "Apple Music", color: "#FA243C" },
  youtube: { Logo: YoutubeLogo, label: "YouTube", color: "#FF0000" },
  tiktok: { Logo: TikTokLogo, label: "TikTok", color: "#000000" },
};

function CampaignList({ campaigns, onSelect, onStart }) {
  const [filter, setFilter] = useState("all");

  if (!campaigns.length) {
    return (
      <div className="campaign-list-empty">
        <div className="campaign-list-empty-title">No campaigns yet</div>
        <div className="campaign-list-empty-sub">Start your first campaign to get your music in front of the right audiences.</div>
        <button type="button" className="campaign-new-btn" onClick={onStart}>Start your first campaign</button>
      </div>
    );
  }

  // Only offer tabs that have something in them.
  const tabs = FILTERS.map((f) => ({ ...f, count: campaigns.filter(f.match).length })).filter((f) => f.count > 0);
  const current = tabs.find((f) => f.id === filter) ?? tabs[0];

  return (
    <section aria-label="Campaigns">
      <div className="campaign-tabs" role="group" aria-label="Filter campaigns">
        {tabs.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`campaign-tab${f.id === current.id ? " campaign-tab--active" : ""}`}
            aria-pressed={f.id === current.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label} <span>{f.count}</span>
          </button>
        ))}
      </div>

      <div className="campaign-list">
        {campaigns.filter(current.match).map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
};

export default CampaignList;
