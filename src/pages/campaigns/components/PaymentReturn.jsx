// Shown when Paystack sends the artist back with ?reference=...
// The result comes from the server, never from the address bar.
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { verifyPayment } from "../payments";
import "../styles/pay.css";

const MESSAGES = {
  checking: "Checking your payment…",
  paid: "Payment received. Your campaign is waiting for RADR approval.",
  failed: "The payment didn't go through. You can try again with Pay now below.",
  pending: "Paystack hasn't confirmed this payment yet.",
  mismatch: "The payment didn't match this campaign. Please contact us.",
  unknown: "We couldn't find that payment. Please contact us if you were charged.",
};

function PaymentReturn({ onSettled }) {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reference) return undefined;
    let cancelled = false;
    verifyPayment(reference)
      .then((result) => {
        if (cancelled) return;
        setStatus(result);
        onSettled();
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err.message);
      });
    return () => { cancelled = true; };
  }, [reference, attempt, onSettled]);

  const retry = useCallback(() => {
    setStatus("checking");
    setError("");
    setAttempt((n) => n + 1);
  }, []);

  if (!reference) return null;

  const canRetry = status === "pending" || status === "error";
  const tone = status === "paid" ? "paid" : ["failed", "mismatch", "error"].includes(status) ? "failed" : "pending";

  return (
    <div className={`pay-banner pay-banner--${tone}`} role="status">
      <span>{error || MESSAGES[status] || MESSAGES.pending}</span>
      {canRetry && <button type="button" onClick={retry}>Check again</button>}
    </div>
  );
}

PaymentReturn.propTypes = { onSettled: PropTypes.func.isRequired };

export default PaymentReturn;
