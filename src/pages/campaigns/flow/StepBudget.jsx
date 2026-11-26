import PropTypes from "prop-types";
import { CUSTOM_MIN, DISCLAIMER, FLEXIBLE, PACKAGES, findPackage, isFutureDate } from "../packages";
import PackageCard from "./PackageCard";
import FlexibleFields from "./FlexibleFields";

function StepBudget({ draft, update }) {
  function choose(id) {
    if (id === draft.package) return;
    const fixed = findPackage(id);
    // Custom and pre-save start empty: no amount shows until the artist enters one.
    const changes = { package: id, budget: fixed ? String(fixed.price) : "" };
    if (id === "presave" && !draft.releaseDate && isFutureDate(draft.track?.release_date)) {
      changes.releaseDate = draft.track.release_date;
    }
    update(changes);
  }

  return (
    <fieldset className="flow-fieldset">
      <legend className="flow-title">Choose your package</legend>
      <p className="flow-sub">One price per campaign, in US dollars.</p>

      <div className="flow-packages">
        {PACKAGES.map((item) => (
          <PackageCard key={item.id} item={item} selected={draft.package === item.id} onSelect={choose} />
        ))}
      </div>

      <div className="flow-options flow-options--two flow-flexible">
        {FLEXIBLE.map(({ id, name, hint }) => (
          <label key={id} className={`flow-option${draft.package === id ? " flow-option--on" : ""}`}>
            <input type="radio" name="package" checked={draft.package === id} onChange={() => choose(id)} />
            <span>
              <span className="flow-option-name">{name} · from ${CUSTOM_MIN}</span>
              <span className="flow-option-hint">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      {(draft.package === "custom" || draft.package === "presave") && (
        <FlexibleFields draft={draft} update={update} />
      )}

      <div className="flow-note">{DISCLAIMER}</div>
    </fieldset>
  );
}

StepBudget.propTypes = { draft: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

export default StepBudget;
