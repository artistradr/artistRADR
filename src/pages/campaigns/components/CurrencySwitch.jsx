import PropTypes from "prop-types";
import { CURRENCIES } from "../currency";
import { useCurrency } from "../useCurrency";
import "../styles/currency.css";

// Switches how prices are shown: US dollars or Naira.
function CurrencySwitch({ disabled = false }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="currency-switch" role="group" aria-label="Currency">
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          type="button"
          className={`currency-switch-btn${currency === c.code ? " currency-switch-btn--on" : ""}`}
          aria-pressed={currency === c.code}
          title={c.label}
          onClick={() => setCurrency(c.code)}
          disabled={disabled}
        >
          {c.symbol} {c.code}
        </button>
      ))}
    </div>
  );
}

CurrencySwitch.propTypes = { disabled: PropTypes.bool };

export default CurrencySwitch;
