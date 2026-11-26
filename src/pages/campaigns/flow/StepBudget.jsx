import PropTypes from "prop-types";
import { DISCLAIMER, PACKAGES, PRESAVE, SUPERCHARGE, findPackage, isFutureDate, superchargeTargets } from "../packages";
import PackageCard from "./PackageCard";
import SuperchargeFields from "./SuperchargeFields";
import PresaveFields from "./PresaveFields";

const SUPERCHARGE_CARD = {
  id: SUPERCHARGE.id,
  name: SUPERCHARGE.name,
  prefix: "from",
  price: SUPERCHARGE.min,
  targets: superchargeTargets(SUPERCHARGE.min),
};

function StepBudget({ draft, update }) {
  function choose(id) {
    if (id === draft.package) return;
    // Pre-save starts empty: no amount shows until the artist enters one.
    let budget = findPackage(id)?.price ?? "";
    if (id === SUPERCHARGE.id) budget = SUPERCHARGE.min;
    const changes = { package: id, budget: String(budget) };
    if (id === PRESAVE.id && !draft.releaseDate && isFutureDate(draft.track?.release_date)) {
      changes.releaseDate = draft.track.release_date;
    }
    update(changes);
  }

  const presaveOn = draft.package === PRESAVE.id;

  return (
    <fieldset className="flow-fieldset">
      <legend className="flow-title">Choose your package</legend>
      <p className="flow-sub">One price per campaign, in US dollars.</p>

      <div className="flow-packages">
        {[...PACKAGES, SUPERCHARGE_CARD].map((item) => (
          <PackageCard key={item.id} item={item} selected={draft.package === item.id} onSelect={choose} />
        ))}
      </div>

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
