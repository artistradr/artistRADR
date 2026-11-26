import PropTypes from "prop-types";
import { PLATFORM_META } from "../components/CampaignList";
import TrackSearch from "./TrackSearch";

function StepTrack({ draft, update }) {
  return (
    <>
      <h2 className="flow-title">What are we promoting?</h2>
      <p className="flow-sub">Find your song, then pick where you want it heard.</p>

      <TrackSearch draft={draft} update={update} />

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
