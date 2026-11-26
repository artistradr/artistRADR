import PropTypes from "prop-types";
import { usePay } from "../usePay";
import "../styles/pay.css";

function PayButton({ campaignId, label = "Pay now" }) {
  const { pay, busy, error } = usePay();
  return (
    <div className="pay-box">
      <button type="button" className="pay-btn" onClick={() => pay(campaignId)} disabled={busy}>
        {busy ? "Opening Paystack…" : label}
      </button>
      {error && <div className="pay-error" role="alert">{error}</div>}
    </div>
  );
}

PayButton.propTypes = { campaignId: PropTypes.string.isRequired, label: PropTypes.string };

export default PayButton;
