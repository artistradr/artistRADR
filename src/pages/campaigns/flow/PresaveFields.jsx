import PropTypes from "prop-types";
import { PRESAVE, localDate } from "../packages";

function PresaveFields({ draft, update }) {
  return (
    <div className="flow-flexible-panel">
      <label className="flow-label" htmlFor="flow-budget">Your budget</label>
      <div className="flow-amount">
        <span>$</span>
        <input
          id="flow-budget"
          type="number"
          inputMode="decimal"
          min={PRESAVE.min}
          step="any"
          placeholder="0"
          value={draft.budget}
          onChange={(e) => update({ budget: e.target.value })}
        />
        <span>USD</span>
      </div>
      <div className="flow-note">Minimum ${PRESAVE.min}</div>

      <label className="flow-label flow-label--spaced" htmlFor="flow-release">Release date</label>
      <input
        id="flow-release"
        className="flow-input"
        type="date"
        min={localDate(1)}
        value={draft.releaseDate}
        onChange={(e) => update({ releaseDate: e.target.value })}
      />
      <label className="flow-check">
        <input type="checkbox" checked={draft.reserve} onChange={(e) => update({ reserve: e.target.checked })} />
        <span>
          <span className="flow-option-name">Request release-day playlist spots</span>
          <span className="flow-option-hint">RADR staff review your request. Spots are not confirmed until then.</span>
        </span>
      </label>
    </div>
  );
}

PresaveFields.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default PresaveFields;
