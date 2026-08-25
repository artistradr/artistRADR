import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Supabase returns error.message strings, not error codes like Firebase did.
function friendlyError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Please enter a valid email address.";
  if (m.includes("password") && m.includes("6")) return "Password must be at least 6 characters.";
  if (m.includes("rate limit")) return "Too many attempts. Try again later.";
  return message || "Registration failed. Please try again.";
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
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

    // If email confirmation is enabled in the Supabase dashboard, signUp
    // succeeds but returns no session — the account exists but isn't logged
    // in until the confirmation link is clicked. Handle both cases.
    if (data.session) {
      navigate("/");
    } else {
      setCheckEmail(true);
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "13px 16px",
    border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px",
    fontFamily: F.b, fontSize: "14px", color: "#111",
    background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} action={{ type: "internal", route: "/sign-in", label: "Sign In" }} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#4DD9D0", background: "rgba(77,217,208,0.08)", border: "0.5px solid rgba(77,217,208,0.3)", borderRadius: "100px", padding: "5px 14px", marginBottom: "18px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4DD9D0", display: "inline-block" }} />
              Join the movement
            </div>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.2rem, 6vw, 3rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#111", margin: "0 0 10px" }}>Create Account</h1>
            <p style={{ fontSize: "14px", color: "#888", fontWeight: 300 }}>
              Already have an account?{" "}
              <Link to="/sign-in" style={{ color: "#D94F2B", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
            </p>
          </div>

          <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

            {error && (
              <div style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
                {error}
              </div>
            )}

            {checkEmail ? (
              <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.7, textAlign: "center" }}>
                Almost there — we sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then sign in.
              </p>
            ) : (
              <form onSubmit={submit}>
                {[
                  { name: "fullName", label: "Full Name", placeholder: "Your name", type: "text" },
                  { name: "email", label: "Email", placeholder: "you@example.com", type: "email" },
                  { name: "password", label: "Password", placeholder: "Min. 6 characters", type: "password" },
                  { name: "confirm", label: "Confirm Password", placeholder: "Repeat password", type: "password" },
                ].map((f, i) => (
                  <div key={f.name} style={{ marginBottom: i === 3 ? "28px" : "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>{f.label}</label>
                    <input type={f.type} name={f.name} value={form[f.name]} onChange={handle} required placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}

                <button
                  type="submit" disabled={loading}
                  style={{ width: "100%", padding: "14px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#ffffff", fontFamily: F.b, fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(217,79,43,0.35)", letterSpacing: "0.2px" }}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>

                <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
                  By registering you agree to our{" "}
                  <Link to="/terms" style={{ color: "#D94F2B", textDecoration: "none" }}>Terms</Link>
                  {" & "}
                  <Link to="/privacy" style={{ color: "#D94F2B", textDecoration: "none" }}>Privacy Policy</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}