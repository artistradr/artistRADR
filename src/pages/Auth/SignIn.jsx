import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Two stages: email first, then password. The email is only checked for shape here.
// Checking whether an account exists would let anyone test which emails are registered.
const STAGES = ["Email", "Password"];
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

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)",
  borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none",
};
const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px",
};
const primaryButton = (loading) => ({
  width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#ffffff",
  fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1, letterSpacing: "0.2px", boxShadow: "0 4px 16px rgba(217,79,43,0.35)",
});
const linkButton = {
  background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F.b, fontSize: "12px",
  fontWeight: 600, color: "#D94F2B",
};
const visuallyHidden = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0, pointerEvents: "none" };

const ANIMATION = `
@keyframes radrStageIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.radr-stage { animation: radrStageIn 0.22s ease-out; }
@media (prefers-reduced-motion: reduce) { .radr-stage { animation: none; } }
`;

function StageProgress({ stage }) {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", gap: "6px" }} aria-hidden="true">
        {STAGES.map((name, i) => (
          <div key={name} style={{ flex: 1, height: "3px", borderRadius: "100px", background: i <= stage ? "#D94F2B" : "rgba(0,0,0,0.1)", transition: "background 0.2s" }} />
        ))}
      </div>
      <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999" }}>
        Step {stage + 1} of {STAGES.length} · {STAGES[stage]}
      </div>
    </div>
  );
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

  // Move the cursor to the field for the current stage.
  useEffect(() => {
    (stage === 0 ? emailRef : passwordRef).current?.focus();
  }, [stage]);

  function goToStage(next) {
    setError("");
    setShowPassword(false);
    setCapsLock(false);
    setStage(next);
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
      navigate(landingPath(location.state?.from), { replace: true });
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
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{ANIMATION}</style>
      <Navbar routes={routes} action={{ type: "internal", route: "/register", label: "Join RADR" }} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.25)", borderRadius: "100px", padding: "5px 14px", marginBottom: "18px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D94F2B", display: "inline-block" }} />
              {stage === 0 ? "Welcome" : "Welcome back"}
            </div>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.2rem, 6vw, 3rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#111", margin: "0 0 10px" }}>Sign In</h1>
            <p style={{ fontSize: "14px", color: "#888", fontWeight: 300 }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={{ color: "#D94F2B", fontWeight: 600, textDecoration: "none" }}>Join RADR</Link>
            </p>
          </div>

          <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

            <StageProgress stage={stage} />

            <div aria-live="polite">
              {error && (
                <div role="alert" style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                  {error}
                </div>
              )}
            </div>

            <form onSubmit={submit} noValidate>
              {stage === 0 ? (
                <div key="email" className="radr-stage">
                  <div style={{ marginBottom: "28px" }}>
                    <label htmlFor="signin-email" style={labelStyle}>Email</label>
                    <input
                      id="signin-email" ref={emailRef} type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
                      placeholder="you@example.com" style={inputStyle}
                    />
                  </div>
                  <button type="submit" style={primaryButton(false)}>Continue</button>
                </div>
              ) : (
                <div key="password" className="radr-stage">
                  {/* Kept in the form so password managers still see the username. */}
                  <input type="email" value={email} readOnly tabIndex={-1} aria-hidden="true" autoComplete="username" style={visuallyHidden} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#fafafa", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px" }}>
                    <span style={{ fontSize: "13px", color: "#333", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
                    <button type="button" onClick={() => goToStage(0)} disabled={loading} style={linkButton}>Change</button>
                  </div>

                  <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label htmlFor="signin-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                      <Link to="/forgot-password" style={{ fontSize: "12px", color: "#D94F2B", textDecoration: "none", fontWeight: 500 }}>Forgot?</Link>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        id="signin-password" ref={passwordRef} type={showPassword ? "text" : "password"} value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        onKeyUp={trackCaps} onKeyDown={trackCaps} onBlur={() => setCapsLock(false)}
                        autoComplete="current-password" placeholder="••••••••"
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
                    {capsLock && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "#b45309" }}>Caps Lock is on.</div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} style={primaryButton(loading)}>
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </div>
              )}
            </form>

            {stage === 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
                  <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
                  <span style={{ fontSize: "11px", color: "#bbb", fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
                </div>

                <button
                  type="button"
                  onClick={() => setError("Google sign-in coming soon.")}
                  style={{ width: "100%", padding: "13px", background: "white", border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#333" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
