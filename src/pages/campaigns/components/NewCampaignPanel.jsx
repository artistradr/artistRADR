import { useState } from "react";
import { PLATFORM_META } from "./CampaignList";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const GOAL_PRESETS = [
  "Editorial + algorithmic playlist placement",
  "UGC creator matching + Shorts placement",
  "Trending sound placement",
  "Radio & editorial pitching",
];

function NewCampaignPanel({ onCancel, onCreate }) {
  const [trackName, setTrackName] = useState("");
  const [platform, setPlatform] = useState("spotify");
  const [budget, setBudget] = useState(50);
  const [goal, setGoal] = useState(GOAL_PRESETS[0]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!trackName.trim()) return;
    onCreate({
      name: trackName.trim(),
      platform,
      budget: Number(budget) || 0,
      goal,
    });
  }

  return (
    <form className="campaign-new-panel" onSubmit={handleSubmit}>
      <div className="campaign-new-panel-title">Start a Campaign</div>
      <div className="campaign-new-panel-sub">Tell us about your track and we'll get it in front of the right audience.</div>

      <label className="campaign-field-label" htmlFor="cmp-track-name">Track name</label>
      <input
        id="cmp-track-name"
        className="campaign-field-input"
        type="text"
        placeholder="e.g. Midnight Hours"
        value={trackName}
        onChange={(e) => setTrackName(e.target.value)}
        required
      />

      <label className="campaign-field-label">Platform</label>
      <div className="campaign-platform-grid">
        {Object.entries(PLATFORM_META).map(([key, { Logo, label, color }]) => (
          <button
            type="button"
            key={key}
            onClick={() => setPlatform(key)}
            className={`campaign-platform-btn${platform === key ? " campaign-platform-btn--active" : ""}`}
            style={platform === key ? { borderColor: color } : undefined}
          >
            <Logo size={22} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <label className="campaign-field-label" htmlFor="cmp-goal">Campaign goal</label>
      <select id="cmp-goal" className="campaign-field-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
        {GOAL_PRESETS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <label className="campaign-field-label" htmlFor="cmp-budget">Monthly budget (USD)</label>
      <input
        id="cmp-budget"
        className="campaign-field-input"
        type="number"
        min="10"
        step="5"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />

      <div className="campaign-new-panel-actions">
        <button type="button" className="campaign-new-panel-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="campaign-new-panel-submit">Start Campaign</button>
      </div>
    </form>
  );
}

export default NewCampaignPanel;