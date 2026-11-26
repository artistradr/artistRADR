import PropTypes from "prop-types";
import { PLATFORM_META } from "../components/CampaignList";
import { money } from "./flowConfig";

// Live summary beside the form, in the style of a checkout page.
function OrderSummary({ draft }) {
  const platform = PLATFORM_META[draft.platform];
  const Logo = platform?.Logo;

  return (
    <aside className="flow-summary" aria-label="Campaign summary">
      <div className="flow-summary-kicker">Campaign summary</div>
      <div className="flow-summary-amount">
        {money(draft.budget)} <span>/ month</span>
      </div>

      <div className="flow-summary-track">
        <span className="flow-summary-logo">{Logo ? <Logo size={20} /> : null}</span>
        <div>
          <div className="flow-summary-name">{draft.name.trim() || "Your track"}</div>
          <div className="flow-summary-muted">{platform?.label}</div>
        </div>
      </div>

      <div className="flow-summary-line">
        <span>Goal</span>
        <strong>{draft.goal}</strong>
      </div>
      <div className="flow-summary-line flow-summary-line--total">
        <span>Charged today</span>
        <strong>{money(0)}</strong>
      </div>
      <p className="flow-summary-muted">No payment is taken in this form.</p>
    </aside>
  );
}

OrderSummary.propTypes = { draft: PropTypes.object.isRequired };

export default OrderSummary;
