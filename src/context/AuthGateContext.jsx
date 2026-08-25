// src/context/AuthGateContext.jsx
// Global auth gate — wrap your app with <AuthGateProvider> and call
// useAuthGate().requireAuth(() => callback) anywhere to trigger the modal.
//
// Migrated from Firebase Auth/Firestore to Supabase, per the same pattern
// established in SupabaseAuthContext.jsx:
//   - supabase.auth.signInWithPassword / supabase.auth.signUp replace the
//     Firebase calls. Both return { data, error } instead of throwing, so
//     errors are checked explicitly and re-thrown-as-message for the
//     existing catch blocks below to keep working unchanged.
//   - On register, the profiles row is written manually after signUp,
//     using full_name (snake_case) and default role "subscriber" to match
//     the actual public.profiles schema (no separate "email" or
//     "createdAt" columns — email lives on auth.users, created_at
//     defaults on the table itself).
//   - NOTE: if email confirmation is required on this Supabase project,
//     signUp() returns a user but no active session until the user
//     confirms their email. The profiles insert below assumes RLS allows
//     an insert where auth.uid() = id; if confirmation is required and
//     RLS is strict, this insert will need to move to a server-side
//     trigger (handle_new_user on auth.users) instead. Flagging this so
//     it isn't silently broken in production — test the register flow
//     end-to-end after dropping this in.

import { createContext, useContext, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AuthGateContext = createContext(null);

export function useAuthGate() {
  return useContext(AuthGateContext);
}

// ── tiny helpers ──────────────────────────────────────────────────────────────
function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function AuthGateModal({ isOpen, onClose, onSuccess, config }) {
  const [mode, setMode]           = useState("gate");    // "gate" | "signin" | "register"
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const reset = () => { setMode("gate"); setName(""); setEmail(""); setPassword(""); setError(null); setLoading(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleSignIn = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      reset();
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(friendlyError(e.message));
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ id: data.user.id, full_name: name, role: "subscriber" });
        // Don't fail the whole registration UX over a profile-row hiccup —
        // the auth account exists either way — but surface it so it's not
        // silently lost the way the old console.log-only version was.
        if (profileError) console.error("Profile row insert failed:", profileError.message);
      }

      reset();
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(friendlyError(e.message));
    }
    setLoading(false);
  };

  // Supabase auth errors come back as message strings, not the
  // "auth/xyz" codes Firebase used — match on message content instead.
  const friendlyError = (message = "") => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "Incorrect email or password. Please try again.";
    if (m.includes("user already registered")) return "An account with this email already exists.";
    if (m.includes("password should be at least")) return "Password must be at least 6 characters.";
    if (m.includes("unable to validate email") || m.includes("invalid email")) return "Please enter a valid email address.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please try again later.";
    if (m.includes("email not confirmed")) return "Please confirm your email before signing in.";
    return "Something went wrong. Please try again.";
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes gateBackdrop { from{opacity:0} to{opacity:1} }
        @keyframes gateSlide { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gateSpin { to{transform:rotate(360deg)} }
        .gate-backdrop { position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:80px 1.5rem 1.5rem; }
        .gate-bg { position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px); }
        .gate-modal { position:relative;width:100%;max-width:440px;background:white;border-radius:24px;overflow:hidden;animation:gateSlide 280ms cubic-bezier(.175,.885,.32,1.1) both; box-shadow:0 32px 80px rgba(0,0,0,0.22); }
        .gate-input { width:100%;padding:12px 14px;border-radius:10px;border:0.5px solid rgba(0,0,0,0.14);background:#f7f6f3;font-family:var(--font-body);font-size:14px;color:#111;outline:none;box-sizing:border-box;transition:border-color 150ms; }
        .gate-input:focus { border-color:rgba(0,0,0,0.3); }
        .gate-btn-primary { width:100%;padding:14px;border-radius:12px;border:none;background:#111;color:white;font-family:var(--font-body);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 150ms,transform 100ms;letter-spacing:0.3px; }
        .gate-btn-primary:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .gate-btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        .gate-btn-secondary { width:100%;padding:13px;border-radius:12px;border:0.5px solid rgba(0,0,0,0.12);background:transparent;color:#555;font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;transition:background 150ms,border-color 150ms; }
        .gate-btn-secondary:hover{background:#f7f6f3;border-color:rgba(0,0,0,0.18)}
        .gate-close { position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 150ms;z-index:1; }
        .gate-close:hover{background:rgba(0,0,0,0.1)}
        .gate-spinner { width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:white;animation:gateSpin 700ms linear infinite;flex-shrink:0; }
        .gate-pw-wrap { position:relative; }
        .gate-pw-eye { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;display:flex;align-items:center;padding:4px; }
        .gate-pw-eye:hover{color:#555}
        .gate-divider { display:flex;align-items:center;gap:12px;margin:8px 0; }
        .gate-divider::before,.gate-divider::after{content:'';flex:1;height:0.5px;background:rgba(0,0,0,0.1);}
        .gate-tab { flex:1;padding:10px;border:none;background:none;font-family:var(--font-body);font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:#aaa;transition:all 150ms; }
        .gate-tab.active{color:#111;border-bottom-color:#111;}
      `}</style>

      <div className="gate-backdrop">
        <div className="gate-bg" onClick={handleClose} />
        <div className="gate-modal">

          {/* Close */}
          <button className="gate-close" onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* ── GATE view ── */}
          {mode === "gate" && (
            <div>
              {/* Top banner */}
              <div style={{ background: "linear-gradient(135deg,#111 0%,#1a1a1a 100%)", padding: "40px 36px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                {/* Subtle radial glow */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(217,79,43,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(217,79,43,0.15)", border: "0.5px solid rgba(217,79,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <LockIcon />
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "white", marginBottom: "8px" }}>
                    {config?.title || "Members Only"}
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.65, maxWidth: "300px", margin: "0 auto" }}>
                    {config?.description || "Create a free RADR account or sign in to access this feature."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "28px 32px 32px" }}>
                <button className="gate-btn-primary" onClick={() => { setMode("register"); setError(null); }}>
                  Create Free Account
                </button>
                <div className="gate-divider" style={{ margin: "16px 0" }}>
                  <span style={{ fontSize: "11px", color: "#ccc", fontWeight: 500 }}>already have an account?</span>
                </div>
                <button className="gate-btn-secondary" onClick={() => { setMode("signin"); setError(null); }}>
                  Sign In
                </button>

                {/* Benefits */}
                <div style={{ marginTop: "24px", padding: "16px", background: "#f7f6f3", borderRadius: "12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#aaa", marginBottom: "12px" }}>What you get</div>
                  {(config?.benefits || [
                    "Submit tracks to RADR playlists",
                    "Access premium tools & resources",
                    "Exclusive editorial features",
                  ]).map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: "12px", color: "#555", fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SIGN IN view ── */}
          {mode === "signin" && (
            <div>
              <div style={{ padding: "32px 32px 0" }}>
                <button onClick={() => { setMode("gate"); setError(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "12px", fontWeight: 600, padding: 0, marginBottom: "24px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#111", marginBottom: "6px" }}>Welcome Back</div>
                <p style={{ fontSize: "13px", color: "#aaa", fontWeight: 300, marginBottom: "24px" }}>Sign in to your RADR account to continue.</p>
              </div>
              <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Email</label>
                  <input className="gate-input" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Password</label>
                  <div className="gate-pw-wrap">
                    <input className="gate-input" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSignIn()} style={{ paddingRight: "42px" }} />
                    <button className="gate-pw-eye" onClick={() => setShowPw((s) => !s)} type="button"><EyeIcon show={showPw} /></button>
                  </div>
                </div>
                {error && <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>{error}</div>}
                <button className="gate-btn-primary" onClick={handleSignIn} disabled={loading} style={{ marginTop: "4px" }}>
                  {loading ? <><div className="gate-spinner" /> Signing in…</> : "Sign In →"}
                </button>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", margin: 0 }}>
                  No account?{" "}
                  <button onClick={() => { setMode("register"); setError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#D94F2B", fontWeight: 600, fontSize: "12px", padding: 0 }}>Create one free</button>
                </p>
              </div>
            </div>
          )}

          {/* ── REGISTER view ── */}
          {mode === "register" && (
            <div>
              <div style={{ padding: "32px 32px 0" }}>
                <button onClick={() => { setMode("gate"); setError(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "12px", fontWeight: 600, padding: 0, marginBottom: "24px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#111", marginBottom: "6px" }}>Join RADR</div>
                <p style={{ fontSize: "13px", color: "#aaa", fontWeight: 300, marginBottom: "24px" }}>Create your free account in seconds.</p>
              </div>
              <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Full Name</label>
                  <input className="gate-input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Email</label>
                  <input className="gate-input" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Password</label>
                  <div className="gate-pw-wrap">
                    <input className="gate-input" type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()} style={{ paddingRight: "42px" }} />
                    <button className="gate-pw-eye" onClick={() => setShowPw((s) => !s)} type="button"><EyeIcon show={showPw} /></button>
                  </div>
                </div>
                {error && <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>{error}</div>}
                <button className="gate-btn-primary" onClick={handleRegister} disabled={loading} style={{ marginTop: "4px" }}>
                  {loading ? <><div className="gate-spinner" /> Creating account…</> : "Create Account →"}
                </button>
                <p style={{ textAlign: "center", fontSize: "11px", color: "#bbb", margin: 0, lineHeight: 1.6 }}>
                  By creating an account you agree to our{" "}
                  <Link to="/terms" style={{ color: "#D94F2B" }} onClick={handleClose}>Terms</Link>{" & "}
                  <Link to="/privacy" style={{ color: "#D94F2B" }} onClick={handleClose}>Privacy Policy</Link>.
                </p>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", margin: 0 }}>
                  Already have an account?{" "}
                  <button onClick={() => { setMode("signin"); setError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#D94F2B", fontWeight: 600, fontSize: "12px", padding: 0 }}>Sign in</button>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthGateProvider({ children }) {
  const [isOpen, setIsOpen]     = useState(false);
  const [config, setConfig]     = useState(null);
  const [callback, setCallback] = useState(null);

  const requireAuth = useCallback((onSuccess, gateConfig = {}) => {
    setConfig(gateConfig);
    setCallback(() => onSuccess);
    setIsOpen(true);
  }, []);

  const closeGate = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    setCallback(null);
  }, []);

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      <AuthGateModal
        isOpen={isOpen}
        onClose={closeGate}
        onSuccess={callback}
        config={config}
      />
    </AuthGateContext.Provider>
  );
}