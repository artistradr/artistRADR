import PropTypes from "prop-types";
import { SUPERCHARGE, isSuperchargeAmount, nextTierAt, superchargeTargets } from "../packages";
import ExtraTrackField from "./ExtraTrackField";

// One payment for a 30-day campaign. Add funds with the slider, the buttons or by typing.
// Targets update live. The artist can add a second song.
function SuperchargeFields({ draft, update }) {
  const { min, max, addSteps } = SUPERCHARGE;
  const amount = Number(draft.budget) || 0;
  const level = Math.min(max, Math.max(min, amount));
  const valid = isSuperchargeAmount(draft.budget);
  const nextAt = valid ? nextTierAt(amount) : null;
  const fill = ((level - min) / (max - min)) * 100;
  const set = (value) => update({ budget: String(value) });

  return (
    <div className="flow-flexible-panel">
      <label className="flow-label" htmlFor="flow-budget">Your budget for {SUPERCHARGE.days} days</label>
      <div className="flow-amount">
        <span>$</span>
        <input
          id="flow-budget"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          value={draft.budget}
          onChange={(e) => update({ budget: e.target.value })}
        />
        <span>USD</span>
      </div>

      <input
        type="range"
        className="flow-volume"
        style={{ "--fill": `${fill}%` }}
        min={min}
        max={max}
        step="1"
        value={level}
        aria-label="Supercharge budget"
        aria-valuetext={`$${level}`}
        onChange={(e) => set(e.target.value)}
      />
      <div className="flow-volume-ends"><span>${min}</span><span>${max}</span></div>

      <div className="flow-add">
        <span className="flow-add-label">Add funds</span>
        {addSteps.map((add) => (
          <button key={add} type="button" className="flow-chip" disabled={amount >= max} onClick={() => set(Math.min(max, level + add))}>
            +${add}
          </button>
        ))}
      </div>

      {valid ? (
        <div className="flow-live" aria-live="polite">
          <div className="flow-package-caption">Campaign targets at ${amount}</div>
          <span className="flow-package-targets">
            {superchargeTargets(amount).map((target) => <span key={target}>{target}</span>)}
          </span>
          {nextAt && <div className="flow-note">Targets next go up at ${nextAt}.</div>}
        </div>
      ) : (
        <div className="flow-note">Enter a whole dollar amount from ${min} to ${max}.</div>
      )}

      <ExtraTrackField draft={draft} update={update} />
    </div>
  );
}

SuperchargeFields.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default SuperchargeFields;
