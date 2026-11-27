// src/pages/Auth/Profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import Breadcrumbs from "components/Breadcrumbs";
import AccountSidebar from "components/AccountSidebar";
import "./Profile.css";

// Where the "Open RADR Studio" button points. Set VITE_STUDIO_URL in .env for
// local testing (e.g. http://localhost:5174); production defaults to the subdomain.
const STUDIO_URL = import.meta.env.VITE_STUDIO_URL || "https://studio.artistradr.com";

export default function Profile() {
  const { user, userRole, roleError } = useSupabaseAuth();
  const [displayName, setDisplayName] = useState("");
  // The last name the database confirmed; the header and sidebar show this one.
  const [savedName, setSavedName] = useState("");
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
        else {
          setDisplayName(data?.full_name || "");
          setSavedName(data?.full_name || "");
        }
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
      setSavedName(displayName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const initial = (savedName || user?.email || "U")[0].toUpperCase();
  const isStaff = userRole === "radrStaff";
  const unchanged = displayName === savedName;

  // Prefer surfacing a real role-fetch failure over the generic save/load
  // error — if roleError is set, userRole silently fell back to "subscriber"
  // (see SupabaseAuthContext.jsx), and the badge below would otherwise look
  // identical to a genuine subscriber account with zero indication anything
  // went wrong.
  const displayError = roleError
    ? `Couldn't verify your role — showing you as Subscriber until this resolves. (${roleError})`
    : error;

  return (
    <div className="profile-page">
      <Navbar routes={routes} />

      <div className="profile-crumbs">
        <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Profile", path: "/profile" }]} />
      </div>

      <div className="profile-shell">
        <div className="profile-main">
          <div className="profile-kicker">Account</div>
          <h1 className="profile-title">Profile</h1>

          <section className="profile-identity">
            <span className="profile-avatar" aria-hidden="true">{initial}</span>
            <div className="profile-identity-text">
              <div className="profile-name">{savedName || (profileLoading ? "Loading…" : "Add your name")}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
            <span className={`profile-badge${isStaff ? " profile-badge--staff" : ""}`}>
              {isStaff ? "RADR Staff" : "Subscriber"}
            </span>
          </section>

          {isStaff && (
            <section className="profile-studio">
              <div>
                <h2 className="profile-studio-title">RADR Studio</h2>
                <p className="profile-studio-sub">Discovery, playlists, submissions and magazine</p>
              </div>
              <a className="profile-btn" href={STUDIO_URL} target="_blank" rel="noopener noreferrer">
                Open RADR Studio
              </a>
            </section>
          )}

          <form className="profile-card profile-form" onSubmit={handleSave}>
            <div className="profile-form-head">
              <h2 className="profile-card-title">Personal details</h2>
              <p className="profile-card-sub">Your display name and sign-in email.</p>
            </div>

            <div className="profile-form-body">
              {displayError && <div className="profile-alert" role="alert">{displayError}</div>}
              <div className="profile-fields">
                <label className="profile-field">
                  <span className="profile-label">Display name</span>
                  <input
                    className="profile-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={profileLoading ? "Loading…" : "Your name"}
                    disabled={profileLoading}
                    autoComplete="name"
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-label">Email</span>
                  <input className="profile-input" value={user?.email || ""} disabled />
                  <span className="profile-hint">Email can&apos;t be changed here.</span>
                </label>
              </div>
            </div>

            <div className="profile-form-foot">
              <span className="profile-status" role="status">{saved ? "✓ Profile updated" : ""}</span>
              <button type="submit" className="profile-btn" disabled={saving || profileLoading || unchanged}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        <AccountSidebar activeKey="profile" name={savedName || undefined} />
      </div>

      <Footer />
    </div>
  );
}
