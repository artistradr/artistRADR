import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import AuthLayout from "./AuthLayout";
import StageHeader from "./StageHeader";
import GoogleButton from "./GoogleButton";

const ASIDE = {
  kicker: "Artist RADR",
  heading: "Your music. Your campaigns. One place.",
  text: "Sign in to start a campaign, follow how it is doing and manage your payments.",
  points: [
    "Start a campaign from $2.99 a day",
    "Follow every campaign in your dashboard",
    "Pay in US dollars or Naira with Paystack",
  ],
};

// Two stages: email, then password. The email is only checked for shape here.
// Checking whether an account exists would let anyone test which emails are registered.
const STAGES = 2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Supabase returns error.message strings, not error codes like Firebase did.
// Match on substring since exact wording can shift between supabase-js versions.
function friendlyError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (m.includes("too many requests") || m.includes("rate limit")) return "Too many attempts. Try again later.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Couldn't reach the server. Check your connection and try again.";
  return message || "Sign in failed. Please try again.";
}

// Where to go after signing in: the page the artist was sent from, if it is a normal
// page on this site. Anything else (other sites, the auth pages themselves) goes home.
function landingPath(from) {
  const path = typeof from === "string" ? from : from?.pathname;
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/(sign-?in|login|register|forgot-password|reset-password)/i.test(path)) return "/";
  return `${path}${from?.search ?? ""}`;
}

export default function SignIn() {
  const { login } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stage, setStage] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const next = landingPath(location.state?.from);

  // Move the cursor to the field for the current stage.
  useEffect(() => {
    (stage === 0 ? emailRef : passwordRef).current?.focus();
  }, [stage]);

  function goToStage(target) {
    setError("");
    setShowPassword(false);
    setCapsLock(false);
    setStage(target);
  }

  function continueWithEmail() {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmail(trimmed);
    goToStage(1);
  }

  async function signIn() {
    if (!password) {
      setError("Enter your password.");
      passwordRef.current?.focus();
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(next, { replace: true });
      return;
    } catch (err) {
      setError(friendlyError(err.message));
      setPassword("");
      passwordRef.current?.focus();
    }
    setLoading(false);
  }

  const submit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (stage === 0) continueWithEmail();
    else signIn();
  };

  const trackCaps = (e) => setCapsLock(Boolean(e.getModifierState?.("CapsLock")));

  return (
    <AuthLayout
      navAction={{ type: "internal", route: "/register", label: "Join RADR" }}
      aside={ASIDE}
      footer={<>New to RADR? <Link to="/register">Create an account</Link></>}
    >
      <StageHeader step={stage} total={STAGES} onBack={() => goToStage(stage - 1)} disabled={loading} />

      <form onSubmit={submit} noValidate>
        {stage === 0 ? (
          <div key="email" className="auth-stage">
            <h1 className="auth-modal-title">Sign in</h1>
            <p className="auth-modal-text">Enter your email to continue.</p>

            <div aria-live="polite">{error && <div role="alert" className="auth-error">{error}</div>}</div>

            <div className="auth-field">
              <label htmlFor="signin-email" className="auth-sr">Email</label>
              <input
                id="signin-email" ref={emailRef} type="email" className="auth-input" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="auth-btn">Continue</button>
          </div>
        ) : (
          <div key="password" className="auth-stage">
            {/* Kept in the form so password managers still see the username. */}
            <input type="email" value={email} readOnly tabIndex={-1} aria-hidden="true" autoComplete="username" className="auth-sr" />

            <h1 className="auth-modal-title">Welcome back</h1>
            <div className="auth-chip">
              <span>{email}</span>
              <button type="button" className="auth-link-btn" onClick={() => goToStage(0)} disabled={loading}>Change</button>
            </div>

            <div aria-live="polite">{error && <div role="alert" className="auth-error">{error}</div>}</div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="signin-password" className="auth-label">Password</label>
                <Link to="/forgot-password" className="auth-link" style={{ fontSize: "12px" }}>Forgot?</Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="signin-password" ref={passwordRef} type={showPassword ? "text" : "password"} className="auth-input"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyUp={trackCaps} onKeyDown={trackCaps} onBlur={() => setCapsLock(false)}
                  autoComplete="current-password" placeholder="••••••••"
                />
                <button
                  type="button" className="auth-toggle" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {capsLock && <div className="auth-hint auth-hint--warn">Caps Lock is on.</div>}
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        )}
      </form>

      {stage === 0 && (
        <>
          <div className="auth-divider"><span>or</span></div>
          <GoogleButton next={next} onError={setError} />
        </>
      )}
    </AuthLayout>
  );
}
