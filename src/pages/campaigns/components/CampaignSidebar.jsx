import { Link, useLocation } from "react-router-dom";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/campaigns",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    )
  },
  {
    key: "campaigns",
    label: "Campaigns",
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
  {
    key: "settings",
    label: "Settings",
    path: "/campaigns/settings",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    )
  },
];

function CampaignSidebar({ activeKey = "campaigns", userName = "Artist", onStartCampaign }) {
  const location = useLocation();

  return (
    <aside className="campaign-sidebar">
      <div className="campaign-sidebar-brand">
        <span className="campaign-sidebar-brand-mark">R</span>
        <span className="campaign-sidebar-brand-text">ARTIST RADR</span>
      </div>

      <nav className="campaign-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeKey || location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`campaign-sidebar-link${isActive ? " campaign-sidebar-link--active" : ""}`}
            >
              <span className="campaign-sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="campaign-sidebar-footer">
        <button type="button" className="campaign-sidebar-cta" onClick={onStartCampaign}>
          + Start Campaign
        </button>

        <div className="campaign-sidebar-profile">
          <div className="campaign-sidebar-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="campaign-sidebar-profile-name">{userName}</div>
            <div className="campaign-sidebar-profile-sub">View profile</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default CampaignSidebar;