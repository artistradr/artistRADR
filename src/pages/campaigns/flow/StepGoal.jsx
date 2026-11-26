import PropTypes from "prop-types";
import { GOALS } from "./flowConfig";

function StepGoal({ draft, update }) {
  return (
    <fieldset className="flow-fieldset">
      <legend className="flow-title">What&apos;s your goal?</legend>
      <p className="flow-sub">Choose the one result that matters most for this track.</p>
      <div className="flow-options">
        {GOALS.map(({ value, hint }) => (
          <label key={value} className={`flow-option${draft.goal === value ? " flow-option--on" : ""}`}>
            <input type="radio" name="goal" checked={draft.goal === value} onChange={() => update({ goal: value })} />
            <span>
              <span className="flow-option-name">{value}</span>
              <span className="flow-option-hint">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

StepGoal.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default StepGoal;
