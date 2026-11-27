import PropTypes from "prop-types";
import { useCurrency } from "../useCurrency";

// Shown once the campaign is saved, while Paystack checkout opens.
function FlowSuccess({ campaign, payment, onView, onDone }) {
  const { currency, rate, format } = useCurrency();
  const estimate = currency === "NGN" && rate ? "about " : "";
  return (
    <div className="flow-card flow-success" role="status">
      <div className="flow-success-mark">✓</div>
      <h2 className="flow-title">{payment.error ? "Saved, but not paid" : "Opening checkout…"}</h2>
      <p className="flow-sub">
        <strong>{campaign.name}</strong> ({estimate}{format(campaign.budget)}) is saved.
        Pay on Paystack to complete it. RADR staff then review it before it starts.
      </p>
      {payment.error && <div className="flow-error" role="alert">{payment.error}</div>}
      <div className="flow-actions">
        <button
          type="button"
          className="flow-btn flow-btn--primary"
          onClick={() => payment.pay(campaign.id)}
          disabled={payment.busy}
        >
          {payment.busy ? "Opening Paystack…" : "Pay now"}
        </button>
      </div>
      <div className="flow-actions">
        <button type="button" className="flow-btn flow-btn--ghost" onClick={onDone}>All campaigns</button>
        <button type="button" className="flow-btn flow-btn--ghost" onClick={onView}>View campaign</button>
      </div>
    </div>
  );
}

FlowSuccess.propTypes = {
  campaign: PropTypes.object.isRequired,
  payment: PropTypes.shape({
    pay: PropTypes.func.isRequired,
    busy: PropTypes.bool.isRequired,
    error: PropTypes.string.isRequired,
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default FlowSuccess;
