import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import AuthLayout from "./AuthLayout";
import GoogleButton from "./GoogleButton";

const F = { b: "var(--font-body)" };

const ASIDE = {
  kicker: "Join the movement",
  heading: "Get your music heard.",
  text: "Create a free account, then start a campaign when you are ready. It takes two steps to sign up.",
  points: [
    "Campaigns from $2.99 a day, from 7 days",
    "RADR staff review every campaign before it starts",
    "Pay in US dollars or Naira with Paystack",
  ],
};

// Two steps: who you are, then your password.
const STEPS = ["Your details", "Password"];
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

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 16px",
  border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px",
  fontFamily: F.b, fontSize: "14px", color: "#111",
  background: "#fafafa", outline: "none",
};
const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px",
};
const primaryButton = (loading) => ({
  width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#ffffff",
  fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(217,79,43,0.35)", letterSpacing: "0.2px",
});
const linkButton = {
  background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F.b, fontSize: "12px", fontWeight: 600, color: "#D94F2B",
};

const ANIMATION = `
@keyframes radrStepIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.radr-step { animation: radrStepIn 0.22s ease-out; }
@media (prefers-reduced-motion: reduce) { .radr-step { animation: none; } }
`;

function StepProgress({ step }) {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", gap: "6px" }} aria-hidden="true">
        {STEPS.map((name, i) => (
          <div key={name} style={{ flex: 1, height: "3px", borderRadius: "100px", background: i <= step ? "#D94F2B" : "rgba(0,0,0,0.1)", transition: "background 0.2s" }} />
        ))}
      </div>
      <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999" }}>
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </div>
    </div>
  );
}

function Check({ ok, children }) {
  return (
    <div style={{ fontSize: "12px", color: ok ? "#1a8f4c" : "#999", marginTop: "6px" }}>
      <span aria-hidden="true">{ok ? "✓" : "○"}</span> {children}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resend, setResend] = useState("idle"); // idle | sending | sent | error
  const nameRef = useRef(null);
  const passwordRef = useRef(null);

  // Move the cursor to the first field of the current step.
  useEffect(() => {
    (step === 0 ? nameRef : passwordRef).current?.focus();
  }, [step]);

  const handle = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  function goToStep(next) {
    setError("");
    setShowPassword(false);
    setCapsLock(false);
    setStep(next);
  }

  function continueToPassword() {
    const name = form.fullName.trim();
    const email = form.email.trim();
    if (!name) { setError("Enter your name."); nameRef.current?.focus(); return; }
    if (!EMAIL_PATTERN.test(email)) { setError("Enter a valid email address."); return; }
    setForm((p) => ({ ...p, fullName: name, email }));
    goToStep(1);
  }

  async function createAccount() {
    if (form.password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); passwordRef.current?.focus(); return; }
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
      setError("An account with this email already exists. Try signing in.");
      setForm((p) => ({ ...p, password: "", confirm: "" }));
      setLoading(false);
      goToStep(0);
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
    if (step === 0) continueToPassword();
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

  return (
    <AuthLayout
      navAction={{ type: "internal", route: "/sign-in", label: "Sign In" }}
      tone="teal"
      badge="Join the movement"
      title="Create Account"
      subtitle={<>Already have an account? <Link to="/sign-in">Sign In</Link></>}
      aside={ASIDE}
    >
      <style>{ANIMATION}</style>

      {checkEmail ? (
        <div role="status">
          <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.7, margin: 0 }}>
            Almost there — we sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then sign in.
          </p>
          <div style={{ marginTop: "20px", fontSize: "13px", color: "#888" }}>
            {resend === "sent" ? (
              "Sent again. Check your inbox and spam folder."
            ) : (
              <>
                Didn&apos;t get it?{" "}
                <button type="button" onClick={resendEmail} disabled={resend === "sending"} style={{ ...linkButton, fontSize: "13px" }}>
                  {resend === "sending" ? "Sending…" : "Send it again"}
                </button>
              </>
            )}
            {resend === "error" && <div style={{ marginTop: "8px", color: "#D94F2B" }}>Couldn&apos;t send it. Try again in a minute.</div>}
          </div>
          <Link to="/sign-in" style={{ display: "inline-block", marginTop: "22px", color: "#D94F2B", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>Go to Sign In</Link>
        </div>
      ) : (
        <>
          <StepProgress step={step} />

          <div aria-live="polite">
            {error && (
              <div role="alert" style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                {error}
              </div>
            )}
          </div>

          <form onSubmit={submit} noValidate>
            {step === 0 ? (
              <div key="details" className="radr-step">
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
                  <input id="reg-name" ref={nameRef} type="text" name="fullName" value={form.fullName} onChange={handle} autoComplete="name" placeholder="Your name" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label htmlFor="reg-email" style={labelStyle}>Email</label>
                  <input id="reg-email" type="email" name="email" value={form.email} onChange={handle} autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" style={inputStyle} />
                </div>
                <button type="submit" style={primaryButton(false)}>Continue</button>
              </div>
            ) : (
              <div key="password" className="radr-step">
                {/* Kept in the form so password managers save the right username. */}
                <input type="email" value={form.email} readOnly tabIndex={-1} aria-hidden="true" autoComplete="username" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0, pointerEvents: "none" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#fafafa", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "13px", color: "#333", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.fullName} · {form.email}</span>
                  <button type="button" onClick={() => goToStep(0)} disabled={loading} style={linkButton}>Edit</button>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="reg-password" style={labelStyle}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="reg-password" ref={passwordRef} type={showPassword ? "text" : "password"} name="password" value={form.password}
                      onChange={handle} onKeyUp={trackCaps} onKeyDown={trackCaps} onBlur={() => setCapsLock(false)}
                      autoComplete="new-password" placeholder={`Min. ${MIN_PASSWORD} characters`}
                      style={{ ...inputStyle, paddingRight: "64px" }}
                    />
                    <button
                      type="button" onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                      style={{ ...linkButton, position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#888" }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {capsLock && <div style={{ marginTop: "8px", fontSize: "12px", color: "#b45309" }}>Caps Lock is on.</div>}
                  <Check ok={longEnough}>At least {MIN_PASSWORD} characters</Check>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
                  <input id="reg-confirm" type={showPassword ? "text" : "password"} name="confirm" value={form.confirm} onChange={handle} autoComplete="new-password" placeholder="Repeat password" style={inputStyle} />
                  <Check ok={matches}>Passwords match</Check>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => goToStep(0)} disabled={loading} style={{ flex: "0 0 auto", padding: "14px 20px", background: "white", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", fontWeight: 600, color: "#333", cursor: loading ? "not-allowed" : "pointer" }}>
                    Back
                  </button>
                  <button type="submit" disabled={loading} style={{ ...primaryButton(loading), flex: 1, width: "auto" }}>
                    {loading ? "Creating account…" : "Create Account"}
                  </button>
                </div>
              </div>
            )}
          </form>

          {step === 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
                <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
                <span style={{ fontSize: "11px", color: "#bbb", fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
              </div>
              <GoogleButton next="/" onError={setError} />
            </>
          )}

          <p style={{ fontSize: "11px", color: "#aaa", marginTop: "16px", lineHeight: 1.6 }}>
            By continuing you agree to our{" "}
            <Link to="/terms" style={{ color: "#D94F2B", textDecoration: "none" }}>Terms</Link>
            {" & "}
            <Link to="/privacy" style={{ color: "#D94F2B", textDecoration: "none" }}>Privacy Policy</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
