import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import radrLogo from "../assets/radr-logo.png";

function Navbar({ routes = [], action = null }) {
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout } = useSupabaseAuth();

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 1200);
      // Decorative search hides earlier than the mobile breakpoint so it
      // never collides with nav links + CTA + avatar on medium desktops.
      setShowSearch(w >= 1300);
      if (w >= 1200) setMobileOpen(false);
    };
    const checkScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("resize", checkSize);
    window.addEventListener("scroll", checkScroll);
    checkSize();
    return () => {
      window.removeEventListener("resize", checkSize);
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const handleDropdownEnter = (e, name) => {
    clearTimeout(closeTimer.current);
    setDropdownAnchor(e.currentTarget);
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    closeTimer.current = setTimeout(() => {
      setDropdownAnchor(null);
      setActiveDropdown("");
    }, 120);
  };

  const handleDropdownMenuEnter = () => clearTimeout(closeTimer.current);
  const handleDropdownMenuLeave = () => {
    closeTimer.current = setTimeout(() => {
      setDropdownAnchor(null);
      setActiveDropdown("");
    }, 120);
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  const initial = user ? (user.displayName || user.email || "U")[0].toUpperCase() : "U";

  // Links this visitor should see, shared by the desktop and mobile menus.
  const canSee = (item) => !item.navHidden && !(item.guestOnly && user) && !(item.userOnly && !user);
  const navRoutes = routes
    .filter(canSee)
    .map((route) => (route.collapse ? { ...route, collapse: route.collapse.filter(canSee) } : route));

  const activeSection = navRoutes.find((r) => r.name === activeDropdown);
  const anchorRect = dropdownAnchor?.getBoundingClientRect?.() ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .radr-navbar {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ── Nav links ── */
        .radr-nav-link {
          position: relative; display: inline-flex; align-items: center; gap: 5px;
          padding: 9px 15px; border-radius: 999px; text-decoration: none; cursor: pointer;
          color: rgba(245,245,245,0.82); font-size: 13.5px; font-weight: 500; letter-spacing: -0.1px;
          transition: background 220ms ease, color 220ms ease;
          white-space: nowrap; user-select: none; background: transparent; border: none; font-family: inherit;
        }
        .radr-nav-link:hover { background: rgba(255,255,255,0.06); color: #F5F5F5; }
        .radr-nav-link:focus-visible { outline: 2px solid #FF542E; outline-offset: 2px; }
        .radr-nav-link::after {
          content: ''; position: absolute; bottom: 1px; left: 16px; right: 16px;
          height: 2px; border-radius: 2px;
          background: #FF542E;
          box-shadow: 0 0 10px 1px rgba(255,84,46,0.55);
          transform: scaleX(0); transition: transform 220ms cubic-bezier(0.4,0,0.2,1); transform-origin: center;
        }
        .radr-nav-link.active { color: #F5F5F5; }
        .radr-nav-link.active::after { transform: scaleX(1); }
        .radr-nav-caret { opacity: 0.5; transition: transform 220ms ease; }
        .radr-nav-link:hover .radr-nav-caret { opacity: 0.85; }

        /* ── Search (decorative) ── */
        .radr-search {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px; padding: 8px 14px 8px 12px;
          min-width: 230px; max-width: 260px;
          transition: background 220ms ease, border-color 220ms ease;
        }
        .radr-search:focus-within { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
        .radr-search svg { flex-shrink: 0; color: rgba(255,255,255,0.5); }
        .radr-search input {
          background: transparent; border: none; outline: none; width: 100%;
          font-family: inherit; font-size: 12.5px; font-weight: 400; letter-spacing: -0.1px;
          color: #F5F5F5;
        }
        .radr-search input::placeholder { color: rgba(255,255,255,0.42); }

        /* ── CTA ── */
        .radr-cta {
          display: inline-flex; align-items: center; gap: 7px; margin-left: 4px;
          background: linear-gradient(135deg, #FF542E 0%, #D94F2B 100%);
          color: #fff !important; padding: 9px 18px; border-radius: 999px;
          font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: -0.1px;
          box-shadow: 0 4px 18px rgba(255,84,46,0.30);
          transition: box-shadow 220ms ease, transform 180ms ease; white-space: nowrap; border: none; cursor: pointer;
        }
        .radr-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(255,84,46,0.42); }
        .radr-cta:focus-visible { outline: 2px solid #FF542E; outline-offset: 2px; }
        .radr-cta svg { transition: transform 180ms ease; }
        .radr-cta:hover svg { transform: translateX(2px); }

        .radr-signin-link {
          display: inline-flex; align-items: center; padding: 9px 15px; border-radius: 999px;
          font-size: 13.5px; font-weight: 500; color: rgba(245,245,245,0.82); text-decoration: none;
          margin-left: 2px; transition: background 220ms ease, color 220ms ease; font-family: inherit;
        }
        .radr-signin-link:hover { background: rgba(255,255,255,0.06); color: #F5F5F5; }

        /* ── Dropdown / mega-menu ── */
        .radr-dropdown {
          position: fixed; z-index: 300;
          background: rgba(15,15,15,0.94);
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.10); border-radius: 18px; padding: 8px;
          min-width: 260px; box-shadow: 0 20px 50px rgba(0,0,0,0.45);
          animation: radrFadeIn 200ms cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes radrFadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .radr-dropdown-item {
          display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
          border-radius: 12px; text-decoration: none;
          font-size: 13.5px; font-weight: 500; transition: background 180ms ease;
          cursor: pointer; width: 100%; box-sizing: border-box; background: transparent; border: none;
          font-family: inherit; text-align: left; color: rgba(245,245,245,0.88);
        }
        .radr-dropdown-item:hover { background: rgba(255,84,46,0.10); color: #F5F5F5; }
        .radr-dropdown-item:focus-visible { outline: 2px solid #FF542E; outline-offset: -2px; }
        .radr-dropdown-item-desc { font-size: 11.5px; font-weight: 400; color: rgba(255,255,255,0.48); }
        .radr-dropdown-item:hover .radr-dropdown-item-desc { color: rgba(255,255,255,0.62); }

        /* ── "New" tag next to a link ── */
        .radr-badge {
          display: inline-flex; align-items: center; margin-left: 8px; padding: 2px 7px;
          border-radius: 999px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: #fff; vertical-align: middle;
          background: linear-gradient(135deg, #FF542E 0%, #D94F2B 100%);
        }


        /* ── Mobile ── */
        .radr-mobile-item {
          display: flex; align-items: center; padding: 13px 16px; border-radius: 12px;
          text-decoration: none; color: #F5F5F5; font-size: 15px; font-weight: 500;
          transition: background 180ms ease; cursor: pointer;
        }
        .radr-mobile-item:hover { background: rgba(255,255,255,0.06); }
        .radr-mobile-child {
          display: flex; align-items: center; padding: 11px 16px 11px 30px; border-radius: 12px;
          text-decoration: none; color: rgba(255,255,255,0.6); font-size: 13.5px; transition: background 180ms ease;
        }
        .radr-mobile-child:hover { background: rgba(255,255,255,0.06); color: #F5F5F5; }

        .radr-hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 999px; cursor: pointer; color: #F5F5F5;
          transition: background 180ms ease; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04);
        }
        .radr-hamburger:hover { background: rgba(255,255,255,0.09); }
        .radr-hamburger:focus-visible { outline: 2px solid #FF542E; outline-offset: 2px; }

        .radr-mobile-panel {
          overflow: hidden; max-height: 0;
          transition: max-height 320ms cubic-bezier(0.4,0,0.2,1);
        }
        .radr-mobile-panel.open { max-height: calc(100vh - 110px); overflow-y: auto; }

        .radr-mobile-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 10px 10px; }

        /* ── Avatar ── */
        .radr-avatar-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: #16181A;
          color: #F5F5F5 !important; display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; cursor: pointer; flex-shrink: 0;
          border: 1.5px solid rgba(255,84,46,0.55);
          box-shadow: 0 0 14px rgba(255,84,46,0.25);
          text-decoration: none; transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .radr-avatar-btn:hover { transform: scale(1.03); box-shadow: 0 0 18px rgba(255,84,46,0.4); }
        .radr-avatar-btn:focus-visible { outline: 2px solid #FF542E; outline-offset: 2px; }
      `}</style>

      <nav
        className="radr-navbar"
        style={{
          position: "fixed",
          top: scrolled ? "16px" : "24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: scrolled ? "calc(100% - 2rem)" : "calc(100% - 3rem)",
          maxWidth: "1180px",
          zIndex: 200,
          background: scrolled ? "rgba(7,9,10,0.88)" : "rgba(10,12,14,0.72)",
          backdropFilter: scrolled ? "blur(28px) saturate(160%)" : "blur(24px) saturate(150%)",
          WebkitBackdropFilter: scrolled ? "blur(28px) saturate(160%)" : "blur(24px) saturate(150%)",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: scrolled ? "0 24px 70px rgba(0,0,0,0.42)" : "0 20px 60px rgba(0,0,0,0.30)",
          padding: "0 16px 0 22px",
          transition: "all 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: scrolled ? "64px" : "72px",
            transition: "height 280ms cubic-bezier(0.4,0,0.2,1)",
            gap: "18px",
          }}
        >
          {/* Brand */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <img src={radrLogo} alt="Artist RADR" style={{ height: "28px", width: "auto", display: "block" }} />
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                {navRoutes.map(({ name, href, route, collapse }) => {
                  const isActive = route && location.pathname === route;
                  if (href) return <a key={name} href={href} target="_blank" rel="noreferrer" className="radr-nav-link">{name}</a>;
                  if (collapse) return (
                    <span key={name} className="radr-nav-link"
                      onMouseEnter={(e) => handleDropdownEnter(e, name)}
                      onMouseLeave={handleDropdownLeave}>
                      {name}
                      <svg className="radr-nav-caret" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  );
                  return <Link key={name} to={route || "/"} className={`radr-nav-link${isActive ? " active" : ""}`}>{name}</Link>;
                })}
              </div>

              {/* Search — decorative only, no backend wired up */}
              {showSearch && (
                <div className="radr-search">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" placeholder="Search articles, artists, topics…" aria-label="Search" />
                </div>
              )}

              {/* Auth area */}
              {user ? (
                <Link to="/profile" className="radr-avatar-btn" title={user.displayName || user.email}>
                  {initial}
                </Link>
              ) : (
                <>
                  <Link to="/sign-in" className="radr-signin-link">Sign In</Link>
                  {action && (
                    action.type === "internal"
                      ? (
                        <Link to={action.route || "/"} className="radr-cta">
                          {action.label}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                      )
                      : (
                        <a href={action.route} target="_blank" rel="noreferrer" className="radr-cta">
                          {action.label}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </a>
                      )
                  )}
                </>
              )}
            </div>
          )}

          {/* Mobile right side */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user && (
                <Link to="/profile" className="radr-avatar-btn" title="Profile">{initial}</Link>
              )}
              <button className="radr-hamburger" onClick={() => setMobileOpen((p) => !p)} aria-label="Menu" aria-expanded={mobileOpen}>
                {mobileOpen
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
                }
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu — separate floating glass panel below the navbar */}
      {isMobile && (
        <div
          className={`radr-mobile-panel${mobileOpen ? " open" : ""}`}
          style={{
            position: "fixed",
            top: scrolled ? "84px" : "100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "480px",
            zIndex: 199,
            background: mobileOpen ? "rgba(10,12,14,0.92)" : "transparent",
            backdropFilter: mobileOpen ? "blur(24px) saturate(150%)" : "none",
            WebkitBackdropFilter: mobileOpen ? "blur(24px) saturate(150%)" : "none",
            border: mobileOpen ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
            borderRadius: "24px",
            boxShadow: mobileOpen ? "0 24px 60px rgba(0,0,0,0.45)" : "none",
            pointerEvents: mobileOpen ? "auto" : "none",
            transition: "top 280ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div style={{ padding: "10px" }}>
            <Link to="/blog" className="radr-mobile-item" onClick={() => setMobileOpen(false)}>RADR</Link>
            {navRoutes.map(({ name, route, href, collapse }) => (
              <MobileNavItem key={name} name={name} route={route} href={href} collapse={collapse} onClose={() => setMobileOpen(false)} />
            ))}

            {user ? (
              <>
                <div className="radr-mobile-divider" />
                <Link to="/profile" className="radr-mobile-item" onClick={() => setMobileOpen(false)}>Profile</Link>
                <Link to="/campaigns/billing" className="radr-mobile-item" onClick={() => setMobileOpen(false)}>Billing</Link>
                <div style={{ margin: "4px 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button onClick={handleLogout} style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(255,84,46,0.30)", borderRadius: "12px", color: "#FF8A6B", fontFamily: "inherit", fontWeight: 600, fontSize: "14px", cursor: "pointer", textAlign: "center" }}>
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="radr-mobile-divider" />
                <div style={{ margin: "4px 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to="/sign-in" onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "12px", background: "rgba(255,84,46,0.10)", border: "1px solid rgba(255,84,46,0.25)", color: "#FF8A6B", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", textAlign: "center" }}>
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "12px", background: "linear-gradient(135deg, #FF542E 0%, #D94F2B 100%)", color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", textAlign: "center", boxShadow: "0 4px 18px rgba(255,84,46,0.30)" }}>
                    Join RADR
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop dropdown / mega-menu */}
      {dropdownAnchor && activeSection?.collapse && anchorRect && (
        <div className="radr-dropdown"
          style={{ top: anchorRect.bottom + 10, left: anchorRect.left }}
          onMouseEnter={handleDropdownMenuEnter}
          onMouseLeave={handleDropdownMenuLeave}>
          {activeSection.collapse.map((item) =>
            item.href ? (
              <a key={item.name} href={item.href} target="_blank" rel="noreferrer" className="radr-dropdown-item">
                <span>{item.name}{item.badge && <span className="radr-badge">{item.badge}</span>}</span>
                {item.description && <span className="radr-dropdown-item-desc">{item.description}</span>}
              </a>
            ) : (
              <Link key={item.name} to={item.route || "/"} className="radr-dropdown-item">
                <span>{item.name}{item.badge && <span className="radr-badge">{item.badge}</span>}</span>
                {item.description && <span className="radr-dropdown-item-desc">{item.description}</span>}
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}

function MobileNavItem({ name, route, href, collapse, onClose }) {
  const [open, setOpen] = useState(false);
  if (collapse) {
    return (
      <div>
        <div className="radr-mobile-item" onClick={() => setOpen((p) => !p)} style={{ justifyContent: "space-between" }} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((p) => !p); }}>
          <span>{name}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease", opacity: 0.55 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div className={`radr-mobile-panel${open ? " open" : ""}`}>
          {collapse.map((child) =>
            child.href
              ? <a key={child.name} href={child.href} target="_blank" rel="noreferrer" className="radr-mobile-child" onClick={onClose}>{child.name}{child.badge && <span className="radr-badge">{child.badge}</span>}</a>
              : <Link key={child.name} to={child.route || "/"} className="radr-mobile-child" onClick={onClose}>{child.name}{child.badge && <span className="radr-badge">{child.badge}</span>}</Link>
          )}
        </div>
      </div>
    );
  }
  if (href) return <a href={href} target="_blank" rel="noreferrer" className="radr-mobile-item" onClick={onClose}>{name}</a>;
  return <Link to={route || "/"} className="radr-mobile-item" onClick={onClose}>{name}</Link>;
}

Navbar.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  action: PropTypes.shape({ type: PropTypes.oneOf(["internal", "external"]), route: PropTypes.string, label: PropTypes.string }),
};

MobileNavItem.propTypes = {
  name: PropTypes.string.isRequired,
  route: PropTypes.string,
  href: PropTypes.string,
  collapse: PropTypes.array,
  onClose: PropTypes.func,
};

export default Navbar;
