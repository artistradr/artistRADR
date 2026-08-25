import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Supabase returns error.message strings, not error codes like Firebase did.
// Match on substring since exact wording can shift between supabase-js versions.
function friendlyError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (m.includes("too many requests") || m.includes("rate limit")) return "Too many attempts. Try again later.";
  return message || "Sign in failed. Please try again.";
}

export default function SignIn() {
  const { login } = useSupabaseAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(friendlyError(err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/register", label: "Join RADR" }} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.25)", borderRadius: "100px", padding: "5px 14px", marginBottom: "18px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D94F2B", display: "inline-block" }} />
              Welcome
            </div>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.2rem, 6vw, 3rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#111", margin: "0 0 10px" }}>Sign In</h1>
            <p style={{ fontSize: "14px", color: "#888", fontWeight: 300 }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={{ color: "#D94F2B", fontWeight: 600, textDecoration: "none" }}>Join RADR</Link>
            </p>
          </div>

          <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

            {error && (
              <div style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@example.com"
                  style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999" }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: "12px", color: "#D94F2B", textDecoration: "none", fontWeight: 500 }}>Forgot?</Link>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }}
                />
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

            <button
              type="button"
              onClick={() => setError("Google sign-in coming soon.")}
              style={{ width: "100%", padding: "13px", background: "white", border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#333" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}