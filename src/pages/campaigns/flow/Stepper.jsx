import PropTypes from "prop-types";
import { STEPS } from "./flowConfig";

// Finished steps are clickable so the artist can go back and change them.
function Stepper({ current, onSelect, disabled }) {
  return (
    <ol className="flow-stepper">
      {STEPS.map((label, i) => {
        const done = i < current;
        let state = "";
        if (done) state = " flow-stepper-item--done";
        else if (i === current) state = " flow-stepper-item--current";
        return (
          <li key={label} className={`flow-stepper-item${state}`} aria-current={i === current ? "step" : undefined}>
            <button type="button" onClick={() => onSelect(i)} disabled={!done || disabled}>
              <span className="flow-stepper-dot">{done ? "✓" : i + 1}</span>
              <span className="flow-stepper-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  current: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default Stepper;
