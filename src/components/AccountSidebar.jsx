import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "context/SupabaseAuthContext";

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
 * Shared right-side account nav. Drop into any account-area page
 * (Profile, Campaigns, Billing) — self-contained
 * styles, real auth user via useSupabaseAuth, sign-out built in.
 *
 * Props:
 *  - activeKey: which NAV_ITEMS key to highlight (defaults to path match)
 *  - onStartCampaign: optional override for the CTA button — if omitted,
 *    the CTA just navigates to /campaigns
 */
function AccountSidebar({ activeKey, onStartCampaign }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useSupabaseAuth();

  const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Artist");
  const initial = (displayName || "A").charAt(0).toUpperCase();

  function handleCta() {
    if (onStartCampaign) {
      onStartCampaign();
    } else {
      navigate("/campaigns");
    }
  }

  async function handleSignOut() {
    await logout();
    navigate("/");
  }

  return (
    <>
      <style>{`
        .radr-acct-sidebar {
          width: 100%;
          background: white;
          border-radius: 20px;
          border: 0.5px solid rgba(0,0,0,0.06);
          padding: 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 100px;
        }
        .radr-acct-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 6px;
        }
        .radr-acct-sidebar-brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #D94F2B;
          color: white;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .radr-acct-sidebar-brand-text {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #111;
        }
        .radr-acct-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .radr-acct-sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #666;
          font-family: var(--font-body);
        }
        .radr-acct-sidebar-link:hover {
          background: rgba(0,0,0,0.03);
        }
        .radr-acct-sidebar-link--active {
          background: rgba(217,79,43,0.08);
          color: #D94F2B;
          font-weight: 700;
        }
        .radr-acct-sidebar-link-icon {
          display: flex;
          flex-shrink: 0;
        }
        .radr-acct-sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-top: 0.5px solid rgba(0,0,0,0.06);
          padding-top: 18px;
        }
        .radr-acct-sidebar-cta {
          background: #D94F2B;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 11px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .radr-acct-sidebar-profile-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .radr-acct-sidebar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D94F2B 0%, #B83E1F 100%);
          color: white;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .radr-acct-sidebar-profile-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #111;
          text-transform: capitalize;
        }
        .radr-acct-sidebar-profile-sub {
          font-size: 11px;
          color: #999;
        }
        .radr-acct-sidebar-signout {
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-body);
          font-size: 11.5px;
          font-weight: 600;
          color: #bbb;
          cursor: pointer;
          text-align: left;
        }
        .radr-acct-sidebar-signout:hover {
          color: #D94F2B;
        }
        @media (max-width: 860px) {
          .radr-acct-sidebar {
            position: static;
          }
        }
      `}</style>

      <aside className="radr-acct-sidebar">
        <div className="radr-acct-sidebar-brand">
          <span className="radr-acct-sidebar-brand-mark">R</span>
          <span className="radr-acct-sidebar-brand-text">ARTIST RADR</span>
        </div>

        <nav className="radr-acct-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey ? item.key === activeKey : location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`radr-acct-sidebar-link${isActive ? " radr-acct-sidebar-link--active" : ""}`}
              >
                <span className="radr-acct-sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="radr-acct-sidebar-footer">
          <button type="button" className="radr-acct-sidebar-cta" onClick={handleCta}>
            + Start Campaign
          </button>

          <div className="radr-acct-sidebar-profile-row">
            <div className="radr-acct-sidebar-avatar">{initial}</div>
            <div>
              <div className="radr-acct-sidebar-profile-name">{displayName}</div>
              <button type="button" className="radr-acct-sidebar-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AccountSidebar;