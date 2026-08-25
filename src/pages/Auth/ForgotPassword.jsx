import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/sign-in", label: "Sign In" }} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2rem, 5vw, 2.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#111", margin: "0 0 10px" }}>
              Reset Password
            </h1>
            <p style={{ fontSize: "14px", color: "#888", fontWeight: 300 }}>
              Remembered it?{" "}
              <Link to="/sign-in" style={{ color: "#D94F2B", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
            </p>
          </div>

          <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
            {error && (
              <div style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                {error}
              </div>
            )}

            {sent ? (
              <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.7, textAlign: "center" }}>
                If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder).
              </p>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="you@example.com"
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }}
                  />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#fff", fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}