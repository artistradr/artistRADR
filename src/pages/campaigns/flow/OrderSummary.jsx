import PropTypes from "prop-types";
import { PLATFORM_META } from "../components/CampaignList";
import { artistNames, safeArtwork } from "../spotifyTrack";
import { packageName } from "../packages";
import { useCurrency } from "../useCurrency";
import { hasBudget } from "./flowConfig";

// Live summary under the form. Amounts appear only once a budget is chosen,
// in the currency the artist picked (Naira amounts are estimates).
function OrderSummary({ draft }) {
  const { currency, rate, format } = useCurrency();
  const platform = PLATFORM_META[draft.platform];
  const Logo = platform?.Logo;
  const art = safeArtwork(draft.track);
  const subtitle = [artistNames(draft.track), platform?.label].filter(Boolean).join(" · ");
  const estimate = currency === "NGN" && rate ? "About " : "";

  return (
    <aside className="flow-summary" aria-label="Campaign summary">
      <div className="flow-summary-kicker">Campaign summary</div>

      <div className="flow-summary-track">
        {art ? (
          <img className="flow-summary-art" src={art} alt="" />
        ) : (
          <span className="flow-summary-logo">{Logo ? <Logo size={20} /> : null}</span>
        )}
        <div>
          <div className="flow-summary-name">{draft.track?.name || draft.name.trim() || "Your song"}</div>
          <div className="flow-summary-muted">{subtitle}</div>
        </div>
      </div>

      <div className="flow-summary-line">
        <span>Goal</span>
        <strong>{draft.goal}</strong>
      </div>
      {hasBudget(draft) && (
        <>
          <div className="flow-summary-line flow-summary-line--total">
            <span>{packageName(draft.package)} package</span>
            <strong>{estimate}{format(draft.budget)}</strong>
          </div>
          <div className="flow-summary-line">
            <span>Due today</span>
            <strong>{estimate}{format(draft.budget)}</strong>
          </div>
        </>
      )}
      <p className="flow-summary-muted">
        You choose your currency and payment method on the last step. Paystack charges in Naira.
      </p>
    </aside>
  );
}

OrderSummary.propTypes = { draft: PropTypes.object.isRequired };

export default OrderSummary;
