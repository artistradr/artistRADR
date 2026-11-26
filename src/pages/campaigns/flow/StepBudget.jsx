import PropTypes from "prop-types";
import { DAILY, DISCLAIMER, PRESAVE, SUPERCHARGE, dailyTargets, dailyTotal, isFutureDate, superchargeTargets } from "../packages";
import PackageCard from "./PackageCard";
import DailyFields from "./DailyFields";
import SuperchargeFields from "./SuperchargeFields";
import PresaveFields from "./PresaveFields";

const DAILY_CARD = {
  id: DAILY.id,
  name: DAILY.name,
  prefix: "from",
  price: DAILY.minRate,
  unit: `per day · ${DAILY.minDays}+ days`,
  targets: dailyTargets(dailyTotal(DAILY.minRate, DAILY.minDays)),
};

const SUPERCHARGE_CARD = {
  id: SUPERCHARGE.id,
  name: SUPERCHARGE.name,
  prefix: "from",
  price: SUPERCHARGE.min,
  unit: `· ${SUPERCHARGE.days} days`,
  targets: superchargeTargets(SUPERCHARGE.min),
};

function StepBudget({ draft, update }) {
  function choose(id) {
    if (id === draft.package) return;
    // Each plan starts from its minimum. Pre-save starts empty until the artist enters an amount.
    const changes = { package: id, budget: "" };
    if (id === DAILY.id) {
      changes.dailyRate = String(DAILY.minRate);
      changes.days = String(DAILY.minDays);
      changes.budget = String(dailyTotal(DAILY.minRate, DAILY.minDays));
    }
    if (id === SUPERCHARGE.id) changes.budget = String(SUPERCHARGE.min);
    if (id === PRESAVE.id && !draft.releaseDate && isFutureDate(draft.track?.release_date)) {
      changes.releaseDate = draft.track.release_date;
    }
    update(changes);
  }

  const presaveOn = draft.package === PRESAVE.id;

  return (
    <fieldset className="flow-fieldset">
      <legend className="flow-title">Choose your plan</legend>
      <p className="flow-sub">One payment per campaign, in US dollars.</p>

      <div className="flow-packages">
        {[DAILY_CARD, SUPERCHARGE_CARD].map((item) => (
          <PackageCard key={item.id} item={item} selected={draft.package === item.id} onSelect={choose} />
        ))}
      </div>

      {draft.package === DAILY.id && <DailyFields draft={draft} update={update} />}
      {draft.package === SUPERCHARGE.id && <SuperchargeFields draft={draft} update={update} />}

      <div className="flow-options flow-flexible">
        <label className={`flow-option${presaveOn ? " flow-option--on" : ""}`}>
          <input type="radio" name="package" checked={presaveOn} onChange={() => choose(PRESAVE.id)} />
          <span>
            <span className="flow-option-name">{PRESAVE.name} · from ${PRESAVE.min}</span>
            <span className="flow-option-hint">{PRESAVE.hint}</span>
          </span>
        </label>
      </div>

      {presaveOn && <PresaveFields draft={draft} update={update} />}

      <div className="flow-note">{DISCLAIMER}</div>
    </fieldset>
  );
}

StepBudget.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default StepBudget;
