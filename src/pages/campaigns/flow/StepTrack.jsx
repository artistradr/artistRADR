import PropTypes from "prop-types";
import { PLATFORM_META } from "../components/CampaignList";

function StepTrack({ draft, update }) {
  return (
    <>
      <h2 className="flow-title">What are we promoting?</h2>
      <p className="flow-sub">Name your track and pick where you want it heard.</p>

      <label className="flow-label" htmlFor="flow-track">Track name</label>
      <input
        id="flow-track"
        className="flow-input"
        type="text"
        placeholder="e.g. Midnight Hours"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        autoFocus
      />

      <fieldset className="flow-fieldset">
        <legend className="flow-label">Platform</legend>
        <div className="flow-options flow-options--two">
          {Object.entries(PLATFORM_META).map(([key, { Logo, label }]) => (
            <label key={key} className={`flow-option${draft.platform === key ? " flow-option--on" : ""}`}>
              <input type="radio" name="platform" checked={draft.platform === key} onChange={() => update({ platform: key })} />
              <Logo size={22} />
              <span className="flow-option-name">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

StepTrack.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default StepTrack;
