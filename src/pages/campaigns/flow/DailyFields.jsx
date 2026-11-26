import PropTypes from "prop-types";
import { DAILY, dailyTargets, dailyTotal, isDailyPlan } from "../packages";
import { money } from "./flowConfig";

// Pick a daily spend and a number of days. The total and the targets update live.
function DailyFields({ draft, update }) {
  const rate = Number(draft.dailyRate) || 0;
  const days = Number(draft.days) || 0;
  const valid = isDailyPlan(draft.dailyRate, draft.days);
  const total = valid ? dailyTotal(draft.dailyRate, draft.days) : 0;
  const rateLevel = Math.min(DAILY.maxRate, Math.max(DAILY.minRate, rate));
  const dayLevel = Math.min(DAILY.maxDays, Math.max(DAILY.minDays, days));
  const rateFill = ((rateLevel - DAILY.minRate) / (DAILY.maxRate - DAILY.minRate)) * 100;
  const dayFill = ((dayLevel - DAILY.minDays) / (DAILY.maxDays - DAILY.minDays)) * 100;

  function change(next) {
    const merged = { dailyRate: draft.dailyRate, days: draft.days, ...next };
    const budget = isDailyPlan(merged.dailyRate, merged.days) ? String(dailyTotal(merged.dailyRate, merged.days)) : "";
    update({ ...next, budget });
  }

  return (
    <div className="flow-flexible-panel">
      <label className="flow-label" htmlFor="flow-daily-rate">Daily spend</label>
      <div className="flow-amount">
        <span>$</span>
        <input
          id="flow-daily-rate"
          type="number"
          inputMode="decimal"
          min={DAILY.minRate}
          max={DAILY.maxRate}
          step="0.01"
          value={draft.dailyRate}
          onChange={(e) => change({ dailyRate: e.target.value })}
        />
        <span>per day</span>
      </div>
      <input
        type="range"
        className="flow-volume"
        style={{ "--fill": `${rateFill}%` }}
        min={DAILY.minRate}
        max={DAILY.maxRate}
        step="0.01"
        value={rateLevel}
        aria-label="Daily spend"
        aria-valuetext={money(rateLevel)}
        onChange={(e) => change({ dailyRate: e.target.value })}
      />
      <div className="flow-volume-ends"><span>{money(DAILY.minRate)}</span><span>{money(DAILY.maxRate)}</span></div>

      <label className="flow-label" htmlFor="flow-daily-days">Number of days</label>
      <div className="flow-amount">
        <input
          id="flow-daily-days"
          type="number"
          inputMode="numeric"
          min={DAILY.minDays}
          max={DAILY.maxDays}
          step="1"
          value={draft.days}
          onChange={(e) => change({ days: e.target.value })}
        />
        <span>days</span>
      </div>
      <input
        type="range"
        className="flow-volume"
        style={{ "--fill": `${dayFill}%` }}
        min={DAILY.minDays}
        max={DAILY.maxDays}
        step="1"
        value={dayLevel}
        aria-label="Number of days"
        aria-valuetext={`${dayLevel} days`}
        onChange={(e) => change({ days: e.target.value })}
      />
      <div className="flow-volume-ends"><span>{DAILY.minDays} days</span><span>{DAILY.maxDays} days</span></div>

      {valid ? (
        <div className="flow-live" aria-live="polite">
          <div className="flow-package-caption">
            {money(rate)} × {days} days = {money(total)}
          </div>
          <span className="flow-package-targets">
            {dailyTargets(total).map((target) => <span key={target}>{target}</span>)}
          </span>
        </div>
      ) : (
        <div className="flow-note">
          Choose {money(DAILY.minRate)} to {money(DAILY.maxRate)} per day, for {DAILY.minDays} to {DAILY.maxDays} days.
        </div>
      )}
    </div>
  );
}

DailyFields.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default DailyFields;
