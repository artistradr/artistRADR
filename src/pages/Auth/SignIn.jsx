import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import AuthLayout from "./AuthLayout";
import GoogleButton from "./GoogleButton";

const F = { b: "var(--font-body)" };

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

export default function SignIn() {
  const { login } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  const next = landingPath(location.state?.from);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
      return;
    } catch (err) {
      setError(friendlyError(err.message));
      setPassword("");
      passwordRef.current?.focus();
    }
    setLoading(false);
  };

  const trackCaps = (e) => setCapsLock(Boolean(e.getModifierState?.("CapsLock")));

  return (
    <AuthLayout
      navAction={{ type: "internal", route: "/register", label: "Join RADR" }}
      badge="Welcome"
      title="Sign In"
      subtitle={<>Don&apos;t have an account? <Link to="/register">Join RADR</Link></>}
      aside={ASIDE}
    >
      <div aria-live="polite">
        {error && (
          <div role="alert" style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
            {error}
          </div>
        )}
      </div>

      <form onSubmit={submit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="signin-email" style={labelStyle}>Email</label>
          <input
            id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
            placeholder="you@example.com" style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label htmlFor="signin-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: "12px", color: "#D94F2B", textDecoration: "none", fontWeight: 500 }}>Forgot?</Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              id="signin-password" ref={passwordRef} type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={trackCaps} onKeyDown={trackCaps} onBlur={() => setCapsLock(false)}
              required autoComplete="current-password" placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: "64px" }}
            />
            <button
              type="button" onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F.b, fontSize: "12px", fontWeight: 600, color: "#888" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {capsLock && <div style={{ marginTop: "8px", fontSize: "12px", color: "#b45309" }}>Caps Lock is on.</div>}
        </div>

        <button
          type="submit" disabled={loading}
          style={{ width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#ffffff", fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, letterSpacing: "0.2px", boxShadow: "0 4px 16px rgba(217,79,43,0.35)" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
        <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
        <span style={{ fontSize: "11px", color: "#bbb", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
      </div>

      <GoogleButton next={next} onError={setError} disabled={loading} />
    </AuthLayout>
  );
}
