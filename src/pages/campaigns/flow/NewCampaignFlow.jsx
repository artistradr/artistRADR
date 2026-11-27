import { useState } from "react";
import PropTypes from "prop-types";
import { usePay } from "../usePay";
import { useCurrency } from "../useCurrency";
import { canPay } from "../currency";
import CurrencySwitch from "../components/CurrencySwitch";
import { INITIAL_DRAFT, STEPS, renewDraft, stepError } from "./flowConfig";
import Stepper from "./Stepper";
import StepTrack from "./StepTrack";
import StepGoal from "./StepGoal";
import StepBudget from "./StepBudget";
import StepReview from "./StepReview";
import StepPayment from "./StepPayment";
import OrderSummary from "./OrderSummary";
import FlowSuccess from "./FlowSuccess";
import "./flow.css";
import "./fields.css";
import "./track.css";
import "./packages.css";

const STEP_VIEWS = [StepTrack, StepGoal, StepBudget, StepReview, StepPayment];
const PACKAGE_STEP = 2;

function NewCampaignFlow({ onExit, onCreate, onView, renewFrom }) {
  // A renewal keeps the song, goal and platform and starts at the Package step.
  const [step, setStep] = useState(renewFrom ? PACKAGE_STEP : 0);
  const [draft, setDraft] = useState(() => (renewFrom ? renewDraft(renewFrom) : INITIAL_DRAFT));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(null);
  const payment = usePay();
  const { currency, format } = useCurrency();

  const isLast = step === STEPS.length - 1;
  const StepView = STEP_VIEWS[step];

  function update(changes) {
    setDraft((prev) => ({ ...prev, ...changes }));
    setError("");
  }

  function goTo(next) {
    setError("");
    setStep(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const problem = stepError(step, draft, currency);
    if (problem) {
      setError(problem);
      return;
    }
    if (!isLast) {
      goTo(step + 1);
      return;
    }
    setSubmitting(true);
    const result = await onCreate({ ...draft, name: draft.name.trim(), budget: Number(draft.budget) });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // The campaign is saved first. If checkout can't open, the next screen offers a retry.
    setSent(result.campaign);
    payment.pay(result.campaign.id);
  }

  if (sent) {
    return <FlowSuccess campaign={sent} payment={payment} onView={() => onView(sent.id)} onDone={onExit} />;
  }

  let submitLabel = "Continue";
  if (step === STEPS.length - 2) submitLabel = "Continue to payment";
  if (isLast) {
    if (submitting) submitLabel = "Saving…";
    else submitLabel = canPay(draft, currency) ? `Pay ${format(draft.budget)}` : "Pay now";
  }

  return (
    <div className="flow">
      <div className="flow-top">
        <Stepper current={step} onSelect={goTo} disabled={submitting} />
        <CurrencySwitch disabled={submitting} />
        <button type="button" className="flow-link" onClick={onExit} disabled={submitting}>
          Cancel
        </button>
      </div>

      <div className="flow-grid">
        <form className="flow-card" onSubmit={handleSubmit} noValidate>
          {/* The key restarts the entrance animation on each step. */}
          <div key={step} className="flow-step">
            <StepView draft={draft} update={update} onEdit={goTo} disabled={submitting} />
          </div>

          {error && <div className="flow-error" role="alert">{error}</div>}

          <div className="flow-actions">
            {step > 0 && (
              <button type="button" className="flow-btn flow-btn--ghost" onClick={() => goTo(step - 1)} disabled={submitting}>
                Back
              </button>
            )}
            <button type="submit" className="flow-btn flow-btn--primary" disabled={submitting}>
              {submitLabel}
            </button>
          </div>
        </form>

        <OrderSummary draft={draft} />
      </div>
    </div>
  );
}

NewCampaignFlow.propTypes = {
  onExit: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  renewFrom: PropTypes.shape({
    name: PropTypes.string,
    track: PropTypes.object,
    platform: PropTypes.string,
    goal: PropTypes.string,
  }),
};

export default NewCampaignFlow;
