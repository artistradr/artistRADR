import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

export default function AdminLogin() {
  const { login } = useSupabaseAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: F.d, fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "white", marginBottom: "8px" }}>
            <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Admin Access Only</div>
        </div>

        <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px" }}>
          <h2 style={{ fontFamily: F.d, fontSize: "1.4rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "white", marginBottom: "28px" }}>Sign In</h2>

          {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "0.5px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#ff6b6b", fontSize: "13px", marginBottom: "20px" }}>{error}</div>}

          <form onSubmit={submit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@artistradr.com" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontFamily: F.b, fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontFamily: F.b, fontSize: "14px", outline: "none" }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "var(--color-red)", border: "none", borderRadius: "10px", color: "white", fontFamily: F.b, fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}