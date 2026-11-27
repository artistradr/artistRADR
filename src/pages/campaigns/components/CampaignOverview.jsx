// Dashboard header: title, the main action and live counts of the artist's campaigns.
import PropTypes from "prop-types";
import { FILTERS } from "../filters";

function CampaignOverview({ campaigns, loading, failed, onStart }) {
  return (
    <header className="campaign-overview">
      <div className="campaign-overview-top">
        <div>
          <div className="campaign-overview-kicker">Campaign Dashboard</div>
          <h1 className="campaign-overview-title">Your Campaigns</h1>
          <p className="campaign-overview-sub">Follow every release from checkout to playlist.</p>
        </div>
        <button type="button" className="campaign-new-btn" onClick={onStart}>
          + New Campaign
        </button>
      </div>

      <dl className="campaign-stats">
        {FILTERS.filter((f) => f.stat).map((f) => (
          <div key={f.id} className="campaign-stat">
            <dt>{f.stat}</dt>
            {/* A count we can't know shows a dash, never a misleading zero. */}
            <dd>{loading || failed || !f.known(campaigns) ? "—" : campaigns.filter(f.match).length}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

CampaignOverview.propTypes = {
  campaigns: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  failed: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
};

export default CampaignOverview;
