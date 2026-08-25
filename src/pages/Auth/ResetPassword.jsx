import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Landing page for the link in the Supabase password-reset email.
// supabase-js reads the recovery token out of the URL fragment on load
// (detectSessionInUrl, on by default) and turns it into a live session —
// no manual token parsing needed here, just wait for it to resolve.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidLink(!!session);
      setReady(true);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else setDone(true);
    setSaving(false);
  };

  return (
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/sign-in", label: "Sign In" }} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2rem, 5vw, 2.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#111", margin: "0 0 10px" }}>Set New Password</h1>
          </div>

          <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
            {!ready && <p style={{ fontSize: "14px", color: "#888", textAlign: "center" }}>Checking your link…</p>}

            {ready && !validLink && (
              <p style={{ fontSize: "14px", color: "#D94F2B", lineHeight: 1.7, textAlign: "center" }}>
                This link is invalid or has expired. Request a new one from the{" "}
                <a href="/forgot-password" style={{ color: "#D94F2B", fontWeight: 600 }}>reset password page</a>.
              </p>
            )}

            {ready && validLink && !done && (
              <form onSubmit={submit}>
                {error && (
                  <div style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                    {error}
                  </div>
                )}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>New Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 characters"
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }} />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Confirm Password</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repeat password"
                    style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }} />
                </div>
                <button type="submit" disabled={saving}
                  style={{ width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#fff", fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Set Password"}
                </button>
              </form>
            )}

            {done && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.7, marginBottom: "20px" }}>Password updated. You're signed in.</p>
                <button onClick={() => navigate("/profile")}
                  style={{ padding: "12px 28px", background: "#111", border: "none", borderRadius: "10px", color: "#fff", fontFamily: F.b, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}>
                  Go to Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}