import { useState } from "react";
import PropTypes from "prop-types";
import { INITIAL_DRAFT, STEPS, draftDays, stepError } from "./flowConfig";
import Stepper from "./Stepper";
import StepTrack from "./StepTrack";
import StepGoal from "./StepGoal";
import StepBudget from "./StepBudget";
import StepReview from "./StepReview";
import OrderSummary from "./OrderSummary";
import FlowSuccess from "./FlowSuccess";
import "./flow.css";
import "./fields.css";
import "./track.css";
import "./packages.css";

const STEP_VIEWS = [StepTrack, StepGoal, StepBudget, StepReview];

function NewCampaignFlow({ onExit, onCreate, onView }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(null);

  const isReview = step === STEPS.length - 1;
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
    const problem = stepError(step, draft);
    if (problem) {
      setError(problem);
      return;
    }
    if (!isReview) {
      goTo(step + 1);
      return;
    }
    setSubmitting(true);
    const result = await onCreate({ ...draft, name: draft.name.trim(), budget: Number(draft.budget), days: draftDays(draft) });
    setSubmitting(false);
    if (result.error) setError(result.error);
    else setSent(result.campaign);
  }

  if (sent) return <FlowSuccess campaign={sent} onView={() => onView(sent.id)} onDone={onExit} />;

  let submitLabel = "Continue";
  if (isReview) submitLabel = submitting ? "Sending…" : "Send for review";

  return (
    <div className="flow">
      <div className="flow-top">
        <Stepper current={step} onSelect={goTo} disabled={submitting} />
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
};

export default NewCampaignFlow;
