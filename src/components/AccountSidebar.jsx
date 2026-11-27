import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { supabase } from "../supabaseClient";
import "./AccountSidebar.css";

const NAV_ITEMS = [
  {
    key: "profile",
    label: "Profile",
    path: "/profile",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    )
  },
  {
    key: "campaigns",
    label: "My Campaigns",
    path: "/campaigns",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l18-7-7 18-2-8-9-3z" />
      </svg>
    )
  },
  {
    key: "billing",
    label: "Billing",
    path: "/campaigns/billing",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2.5" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
];

/**
 * Shared account nav for Profile, Campaigns and Billing. Sits right of the
 * page on desktop and is hidden on phones (the navbar menu covers it).
 *
 * Props:
 *  - activeKey: which NAV_ITEMS key to highlight (defaults to path match)
 *  - onStartCampaign: optional override for the CTA; defaults to /campaigns
 *  - name: saved display name, if the page already has it (skips the fetch)
 */
function AccountSidebar({ activeKey, onStartCampaign, name }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useSupabaseAuth();
  const [fullName, setFullName] = useState("");

  // The name lives in profiles.full_name, not on the auth user.
  useEffect(() => {
    if (!user?.id || name !== undefined) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setFullName(data?.full_name || "");
      });
    return () => { cancelled = true; };
  }, [user?.id, name]);

  const displayName = name || fullName || user?.email?.split("@")[0] || "Artist";
  const initial = displayName.charAt(0).toUpperCase();

  function handleCta() {
    if (onStartCampaign) onStartCampaign();
    else navigate("/campaigns");
  }

  async function handleSignOut() {
    await logout();
    navigate("/");
  }

  return (
    <aside className="acct" aria-label="Account">
      <div className="acct-user">
        <span className="acct-avatar" aria-hidden="true">{initial}</span>
        <div className="acct-user-text">
          <div className="acct-user-name">{displayName}</div>
          <div className="acct-user-email">{user?.email}</div>
        </div>
      </div>

      <button type="button" className="acct-cta" onClick={handleCta}>
        + Start Campaign
      </button>

      <nav className="acct-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey ? item.key === activeKey : location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`acct-link${isActive ? " acct-link--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="acct-link-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button type="button" className="acct-signout" onClick={handleSignOut}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
        </svg>
        Sign out
      </button>
    </aside>
  );
}

export default AccountSidebar;
