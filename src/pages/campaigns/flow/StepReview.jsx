import PropTypes from "prop-types";
import { PLATFORM_META } from "../components/CampaignList";
import { DISCLAIMER, formatPlainDate, packageName, targetsFor } from "../packages";
import { money } from "./flowConfig";

function StepReview({ draft, onEdit, disabled }) {
  const rows = [
    { label: "Track", value: draft.name.trim(), step: 0 },
    { label: "Platform", value: PLATFORM_META[draft.platform]?.label, step: 0 },
    { label: "Goal", value: draft.goal, step: 1 },
    { label: "Package", value: packageName(draft.package), step: 2 },
    { label: "Price", value: money(draft.budget), step: 2 },
  ];
  if (draft.package === "presave") {
    rows.push({ label: "Release date", value: formatPlainDate(draft.releaseDate), step: 2 });
    rows.push({ label: "Release-day spots", value: draft.reserve ? "Requested" : "Not requested", step: 2 });
  } else {
    rows.push({ label: "Targets", value: targetsFor(draft.package, draft.budget).join(", "), step: 2 });
  }

  return (
    <>
      <h2 className="flow-title">Review your campaign</h2>
      <p className="flow-sub">Check the details. RADR staff review every campaign before it starts.</p>

      <dl className="flow-review">
        {rows.map((row) => (
          <div key={row.label} className="flow-review-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <button type="button" className="flow-link" onClick={() => onEdit(row.step)} disabled={disabled} aria-label={`Edit ${row.label}`}>
              Edit
            </button>
          </div>
        ))}
      </dl>
      <div className="flow-note">{DISCLAIMER} Once sent, only RADR staff can remove a campaign.</div>
    </>
  );
}

StepReview.propTypes = {
  draft: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default StepReview;
