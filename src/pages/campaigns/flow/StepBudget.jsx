import PropTypes from "prop-types";
import { BUDGET_PRESETS, MIN_BUDGET, money } from "./flowConfig";

function StepBudget({ draft, update }) {
  return (
    <>
      <h2 className="flow-title">Set your budget</h2>
      <p className="flow-sub">Your monthly budget in US dollars.</p>

      <div className="flow-chips">
        {BUDGET_PRESETS.map((amount) => {
          const on = Number(draft.budget) === amount;
          return (
            <button
              key={amount}
              type="button"
              className={`flow-chip${on ? " flow-chip--on" : ""}`}
              aria-pressed={on}
              onClick={() => update({ budget: String(amount) })}
            >
              ${amount}
            </button>
          );
        })}
      </div>

      <label className="flow-label" htmlFor="flow-budget">Or enter an amount</label>
      <div className="flow-amount">
        <span>$</span>
        <input
          id="flow-budget"
          type="number"
          inputMode="decimal"
          min={MIN_BUDGET}
          step="any"
          placeholder="0"
          value={draft.budget}
          onChange={(e) => update({ budget: e.target.value })}
        />
        <span>USD / month</span>
      </div>
      <div className="flow-note">Minimum {money(MIN_BUDGET)}</div>
    </>
  );
}

StepBudget.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default StepBudget;
