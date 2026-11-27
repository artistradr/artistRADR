import { useState } from "react";
import PropTypes from "prop-types";
import { CURRENCIES, METHODS, formatMoney } from "../currency";
import { useCurrency } from "../useCurrency";
import { money } from "./flowConfig";
import "./payment.css";

// Last step: pick the currency, then the payment method. Paystack charges in Naira,
// so choosing it switches the currency to NGN.
function StepPayment({ draft, update, disabled }) {
  const { currency, rate, rateFailed, rateLoading, setCurrency } = useCurrency();
  const [notice, setNotice] = useState("");

  const method = METHODS.find((m) => m.id === draft.method);
  const usingMethod = Boolean(method?.available && method.currency === currency);
  const total = Number(draft.budget) || 0;

  function chooseCurrency(code) {
    setNotice("");
    setCurrency(code);
  }

  function chooseMethod(next) {
    if (!next.available) return;
    update({ method: next.id });
    if (next.currency && next.currency !== currency) {
      setCurrency(next.currency);
      setNotice(`${next.name} charges in Naira, so your currency was switched to NGN.`);
    } else {
      setNotice("");
    }
  }

  let charge = null;
  if (usingMethod) {
    if (rate) charge = `About ${formatMoney(total * rate, "NGN")}`;
    else if (rateFailed) charge = "Shown on Paystack";
    else if (rateLoading) charge = "Getting today's rate…";
  }

  return (
    <>
      <h2 className="flow-title">Payment</h2>
      <p className="flow-sub">Choose your currency and how you want to pay.</p>

      <fieldset className="flow-pay-group" disabled={disabled}>
        <legend>Currency</legend>
        <div className="flow-pay-row">
          {CURRENCIES.map((c) => (
            <label key={c.code} className={`flow-pay-option${currency === c.code ? " flow-pay-option--on" : ""}`}>
              <input
                type="radio"
                name="flow-currency"
                checked={currency === c.code}
                onChange={() => chooseCurrency(c.code)}
              />
              <span className="flow-pay-name">{c.symbol} {c.code}</span>
              <span className="flow-pay-note">{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flow-pay-group" disabled={disabled}>
        <legend>Payment method</legend>
        <div className="flow-pay-row">
          {METHODS.map((m) => {
            const on = m.available && usingMethod && m.id === draft.method;
            let state = "";
            if (on) state = " flow-pay-option--on";
            else if (!m.available) state = " flow-pay-option--off";
            return (
              <label key={m.id} className={`flow-pay-option${state}`}>
                <input
                  type="radio"
                  name="flow-method"
                  checked={on}
                  disabled={!m.available}
                  onChange={() => chooseMethod(m)}
                />
                <span className="flow-pay-name">{m.name}</span>
                <span className="flow-pay-note">{m.note}</span>
                {!m.available && <span className="flow-pay-soon">Coming soon</span>}
              </label>
            );
          })}
        </div>
        {notice && <div className="flow-note" role="status">{notice}</div>}
        {!notice && currency === "USD" && (
          <div className="flow-note" role="status">
            Paying in USD will be available with Flutterwave. For now, choose Paystack to pay in Naira.
          </div>
        )}
      </fieldset>

      <div className="flow-pay-total">
        <div className="flow-pay-total-line">
          <span>Plan total</span>
          <strong>{money(total)}</strong>
        </div>
        {charge && (
          <div className="flow-pay-total-line flow-pay-total-line--big">
            <span>You pay</span>
            <strong>{charge}</strong>
          </div>
        )}
        {usingMethod && (
          <p className="flow-pay-hint">
            Prices are set in US dollars and converted to Naira at today&apos;s rate when you pay.
            Paystack&apos;s checkout page shows the exact amount before you confirm.
          </p>
        )}
      </div>
    </>
  );
}

StepPayment.propTypes = {
  draft: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default StepPayment;
