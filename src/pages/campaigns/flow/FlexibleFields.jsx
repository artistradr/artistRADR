import PropTypes from "prop-types";
import { CUSTOM_LENGTHS, CUSTOM_MIN, localDate } from "../packages";

// Budget plus either a length (custom) or a release date (pre-save).
function FlexibleFields({ draft, update }) {
  return (
    <div className="flow-flexible-panel">
      <label className="flow-label" htmlFor="flow-budget">Your budget</label>
      <div className="flow-amount">
        <span>$</span>
        <input
          id="flow-budget"
          type="number"
          inputMode="decimal"
          min={CUSTOM_MIN}
          step="any"
          placeholder="0"
          value={draft.budget}
          onChange={(e) => update({ budget: e.target.value })}
        />
        <span>USD</span>
      </div>
      <div className="flow-note">Minimum ${CUSTOM_MIN}</div>

      {draft.package === "custom" ? (
        <>
          <div className="flow-label flow-label--spaced">Campaign length</div>
          <div className="flow-chips">
            {CUSTOM_LENGTHS.map(({ days, label }) => (
              <button
                key={days}
                type="button"
                className={`flow-chip${draft.customDays === days ? " flow-chip--on" : ""}`}
                aria-pressed={draft.customDays === days}
                onClick={() => update({ customDays: days })}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

FlexibleFields.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default FlexibleFields;
