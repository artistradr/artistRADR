import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

export default function Profile() {
  const { user, userRole, roleError, logout } = useSupabaseAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // full_name lives in profiles, not on the auth user object — fetch it directly
  // rather than trusting user_metadata, which goes stale after the first edit.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setDisplayName(data?.full_name || "");
        setProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: displayName })
      .eq("id", user.id);

    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const isStaff = userRole === "radrStaff";

  // Prefer surfacing a real role-fetch failure over the generic save/load
  // error — if roleError is set, userRole silently fell back to "subscriber"
  // (see SupabaseAuthContext.jsx), and the badge below would otherwise look
  // identical to a genuine subscriber account with zero indication anything
  // went wrong.
  const displayError = roleError
    ? `Couldn't verify your role — showing you as Subscriber until this resolves. (${roleError})`
    : error;

  return (
    <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar routes={routes} />

      <div style={{ flex: 1, maxWidth: "700px", margin: "0 auto", width: "100%", padding: "120px 2rem 80px" }}>

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px", flexWrap: "wrap" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #D94F2B 0%, #B83E1F 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 800, color: "white", fontFamily: F.d, flexShrink: 0, boxShadow: "0 6px 24px rgba(217,79,43,0.4)" }}>
            {initial}
          </div>
          <div>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#111", margin: "0 0 4px" }}>
              {displayName || "My Profile"}
            </h1>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>{user?.email}</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: "100px", background: isStaff ? "rgba(217,79,43,0.1)" : "rgba(77,217,208,0.1)", color: isStaff ? "#D94F2B" : "#4DD9D0", border: `0.5px solid ${isStaff ? "rgba(217,79,43,0.35)" : "rgba(77,217,208,0.35)"}` }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {isStaff ? "RADR Staff" : "Subscriber"}
            </span>
          </div>
        </div>

        {/* Admin card — staff only */}
        {isStaff && (
          <div style={{ background: "#111", borderRadius: "16px", padding: "28px 32px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", border: "0.5px solid rgba(217,79,43,0.4)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "6px" }}>Staff Access</div>
              <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", marginBottom: "4px" }}>Admin Dashboard</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>Manage posts, content and platform settings</div>
            </div>
            <Link to="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#D94F2B", color: "white", padding: "12px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 700, textDecoration: "none", flexShrink: 0, boxShadow: "0 4px 16px rgba(217,79,43,0.4)", position: "relative", zIndex: 1 }}>
              Go to Admin
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Edit profile */}
        <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "32px", marginBottom: "16px" }}>
          <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "24px" }}>Edit Profile</div>

          {displayError && (
            <div style={{ background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.3)", borderRadius: "10px", padding: "11px 16px", color: "#D94F2B", fontSize: "13px", fontWeight: 500, marginBottom: "20px" }}>
              {displayError}
            </div>
          )}

          {saved && (
            <div style={{ background: "rgba(77,217,208,0.08)", border: "0.5px solid rgba(77,217,208,0.35)", borderRadius: "10px", padding: "11px 16px", color: "#35B8B0", fontSize: "13px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✓</span> Profile updated successfully
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Display Name</label>
              <input
                value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profileLoading ? "Loading…" : "Your name"} disabled={profileLoading}
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#111", background: "#fafafa", outline: "none" }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Email</label>
              <input value={user?.email || ""} disabled style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "0.5px solid rgba(0,0,0,0.07)", borderRadius: "10px", fontFamily: F.b, fontSize: "14px", color: "#bbb", background: "#f5f5f5", outline: "none", cursor: "not-allowed" }} />
              <div style={{ fontSize: "11px", color: "#ccc", marginTop: "4px" }}>Email cannot be changed here</div>
            </div>
            <button type="submit" disabled={saving || profileLoading} style={{ padding: "12px 28px", background: "#D94F2B", border: "none", borderRadius: "10px", color: "#ffffff", fontFamily: F.b, fontSize: "13.5px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(217,79,43,0.3)" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "2px" }}>Sign Out</div>
            <div style={{ fontSize: "13px", color: "#aaa", fontWeight: 300 }}>You will be returned to the home page</div>
          </div>
          <button onClick={handleLogout} style={{ padding: "10px 22px", background: "transparent", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "10px", color: "#555", fontFamily: F.b, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}