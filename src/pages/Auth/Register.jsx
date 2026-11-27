import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import AuthLayout from "./AuthLayout";
import StageHeader from "./StageHeader";
import GoogleButton from "./GoogleButton";

const ASIDE = {
  kicker: "Join the movement",
  heading: "Get your music heard.",
  text: "Create a free account, then start a campaign when you are ready. Signing up takes three quick steps.",
  points: [
    "Campaigns from $2.99 a day, from 7 days",
    "RADR staff review every campaign before it starts",
    "Pay in US dollars or Naira with Paystack",
  ],
};

// Three stages, one question each: name, email, password.
const STAGES = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

// Supabase returns error.message strings, not error codes like Firebase did.
function friendlyError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Try signing in.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Please enter a valid email address.";
  if (m.includes("password") && m.includes("6")) return "Password must be at least 6 characters.";
  if (m.includes("rate limit")) return "Too many attempts. Try again later.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Couldn't reach the server. Check your connection and try again.";
  return message || "Registration failed. Please try again.";
}

export default function Register() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resend, setResend] = useState("idle"); // idle | sending | sent | error
  const fieldRefs = [useRef(null), useRef(null), useRef(null)];

  // Move the cursor to the field for the current stage.
  useEffect(() => {
    if (!checkEmail) fieldRefs[stage].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, checkEmail]);

  const handle = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  function goToStage(target) {
    setError("");
    setShowPassword(false);
    setCapsLock(false);
    setStage(target);
  }

  function continueFromName() {
    const name = form.fullName.trim();
    if (!name) { setError("Enter your name."); return; }
    setForm((p) => ({ ...p, fullName: name }));
    goToStage(1);
  }

  function continueFromEmail() {
    const email = form.email.trim();
    if (!EMAIL_PATTERN.test(email)) { setError("Enter a valid email address."); return; }
    setForm((p) => ({ ...p, email }));
    goToStage(2);
  }

  async function createAccount() {
    if (form.password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); fieldRefs[2].current?.focus(); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // handle_new_user trigger reads this to populate profiles.full_name —
        // without it every new profile gets a null name.
        data: { full_name: form.fullName },
      },
    });

    if (err) {
      setError(friendlyError(err.message));
      setLoading(false);
      return;
    }

    // With email confirmation on, Supabase hides that an email is taken: it returns a user
    // with no identities instead of an error. Tell the artist, and let them fix the email.
    if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
      setForm((p) => ({ ...p, password: "", confirm: "" }));
      setLoading(false);
      goToStage(1);
      setError("An account with this email already exists. Try signing in.");
      return;
    }

    // If email confirmation is enabled in the Supabase dashboard, signUp
    // succeeds but returns no session — the account exists but isn't logged
    // in until the confirmation link is clicked. Handle both cases.
    if (data.session) {
      navigate("/");
    } else {
      setCheckEmail(true);
      setLoading(false);
    }
  }

  const submit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (stage === 0) continueFromName();
    else if (stage === 1) continueFromEmail();
    else createAccount();
  };

  async function resendEmail() {
    if (resend === "sending") return;
    setResend("sending");
    const { error: err } = await supabase.auth.resend({ type: "signup", email: form.email });
    setResend(err ? "error" : "sent");
  }

  const trackCaps = (e) => setCapsLock(Boolean(e.getModifierState?.("CapsLock")));
  const longEnough = form.password.length >= MIN_PASSWORD;
  const matches = form.confirm.length > 0 && form.password === form.confirm;
  const errorBox = <div aria-live="polite">{error && <div role="alert" className="auth-error">{error}</div>}</div>;

  const footer = <>Already have an account? <Link to="/sign-in">Sign in</Link></>;
  const aside = ASIDE;
  const navAction = { type: "internal", route: "/sign-in", label: "Sign In" };

  if (checkEmail) {
    return (
      <AuthLayout navAction={navAction} aside={aside} footer={footer}>
        <div role="status" className="auth-stage">
          <h1 className="auth-modal-title">Check your email</h1>
          <p className="auth-modal-text">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then sign in.
          </p>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
            {resend === "sent" ? (
              "Sent again. Check your inbox and spam folder."
            ) : (
              <>
                Didn&apos;t get it?{" "}
                <button type="button" className="auth-link-btn" style={{ fontSize: "13px" }} onClick={resendEmail} disabled={resend === "sending"}>
                  {resend === "sending" ? "Sending…" : "Send it again"}
                </button>
              </>
            )}
            {resend === "error" && <div style={{ marginTop: "8px", color: "#D94F2B" }}>Couldn&apos;t send it. Try again in a minute.</div>}
          </div>
          <Link to="/sign-in" className="auth-btn" style={{ display: "block", boxSizing: "border-box", textAlign: "center", textDecoration: "none" }}>Go to Sign In</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout navAction={navAction} aside={aside} footer={footer}>
      <StageHeader step={stage} total={STAGES} onBack={() => goToStage(stage - 1)} disabled={loading} />

      <form onSubmit={submit} noValidate>
        {stage === 0 && (
          <div key="name" className="auth-stage">
            <h1 className="auth-modal-title">Create account</h1>
            <p className="auth-modal-text">First, what should we call you?</p>
            {errorBox}
            <div className="auth-field">
              <label htmlFor="reg-name" className="auth-sr">Full name</label>
              <input id="reg-name" ref={fieldRefs[0]} type="text" name="fullName" className="auth-input" value={form.fullName} onChange={handle} autoComplete="name" placeholder="Your name" />
            </div>
            <button type="submit" className="auth-btn">Continue</button>
          </div>
        )}

        {stage === 1 && (
          <div key="email" className="auth-stage">
            <h1 className="auth-modal-title">Your email</h1>
            <p className="auth-modal-text">Hi {form.fullName}. Where should we send updates about your campaigns?</p>
            {errorBox}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-sr">Email</label>
              <input id="reg-email" ref={fieldRefs[1]} type="email" name="email" className="auth-input" value={form.email} onChange={handle} autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" />
            </div>
            <button type="submit" className="auth-btn">Continue</button>
          </div>
        )}

        {stage === 2 && (
          <div key="password" className="auth-stage">
            {/* Kept in the form so password managers save the right username. */}
            <input type="email" value={form.email} readOnly tabIndex={-1} aria-hidden="true" autoComplete="username" className="auth-sr" />

            <h1 className="auth-modal-title">Create a password</h1>
            <div className="auth-chip">
              <span>{form.email}</span>
              <button type="button" className="auth-link-btn" onClick={() => goToStage(1)} disabled={loading}>Change</button>
            </div>
            {errorBox}

            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password" ref={fieldRefs[2]} type={showPassword ? "text" : "password"} name="password" className="auth-input"
                  value={form.password} onChange={handle} onKeyUp={trackCaps} onKeyDown={trackCaps} onBlur={() => setCapsLock(false)}
                  autoComplete="new-password" placeholder={`Min. ${MIN_PASSWORD} characters`}
                />
                <button
                  type="button" className="auth-toggle" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {capsLock && <div className="auth-hint auth-hint--warn">Caps Lock is on.</div>}
              <div className={`auth-hint${longEnough ? " auth-hint--ok" : ""}`}><span aria-hidden="true">{longEnough ? "✓" : "○"}</span> At least {MIN_PASSWORD} characters</div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-confirm" className="auth-label">Confirm password</label>
              <input id="reg-confirm" type={showPassword ? "text" : "password"} name="confirm" className="auth-input" value={form.confirm} onChange={handle} autoComplete="new-password" placeholder="Repeat password" />
              <div className={`auth-hint${matches ? " auth-hint--ok" : ""}`}><span aria-hidden="true">{matches ? "✓" : "○"}</span> Passwords match</div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        )}
      </form>

      {stage === 0 && (
        <>
          <div className="auth-divider"><span>or</span></div>
          <GoogleButton next="/" onError={setError} />
        </>
      )}

      <p className="auth-fine">
        By continuing you agree to our <Link to="/terms">Terms</Link> &amp; <Link to="/privacy">Privacy Policy</Link>
      </p>
    </AuthLayout>
  );
}
