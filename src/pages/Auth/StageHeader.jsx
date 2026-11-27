import PropTypes from "prop-types";

// Top row of the modal: a back arrow (after the first stage) and progress dots.
export default function StageHeader({ step, total, onBack, disabled = false }) {
  return (
    <div className="auth-stagebar">
      {step > 0 ? (
        <button type="button" className="auth-back" onClick={onBack} disabled={disabled} aria-label="Go back">←</button>
      ) : (
        <span className="auth-back auth-back--empty" aria-hidden="true" />
      )}
      <div className="auth-dots" role="img" aria-label={`Step ${step + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => {
          let state = "";
          if (i === step) state = " auth-dot--on";
          else if (i < step) state = " auth-dot--done";
          return <span key={i} className={`auth-dot${state}`} />;
        })}
      </div>
    </div>
  );
}

StageHeader.propTypes = {
  step: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
