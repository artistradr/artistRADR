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
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout } = useSupabaseAuth();

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1200);
      if (window.innerWidth >= 1200) setMobileOpen(false);
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

  // Build desktop nav routes — when logged in, replace Get Started collapse
  // with only: Playlist Submission, Contact Us, Sign Out (as button)
  const desktopRoutes = routes.map((route) => {
    if (route.name === "Get Started") {
      return {
        ...route,
        collapse: user
          ? [
              { name: "Playlist Submission", description: "Submit your track for playlists", route: "/submit-track" },
              { name: "Contact Us", description: "Get in touch with our team", route: "/contact-us" },
              { name: "__signout__" }, // special marker
            ]
          : route.collapse.filter((item) => !item.guestOnly || !user),
      };
    }
    // Hide guestOnly items in other dropdowns when logged in
    if (route.collapse) {
      return {
        ...route,
        collapse: route.collapse.filter((item) => !(item.guestOnly && user)),
      };
    }
    return route;
  });

  const activeSection = desktopRoutes.find((r) => r.name === activeDropdown);
  const anchorRect = dropdownAnchor?.getBoundingClientRect?.() ?? null;

  // Mobile routes — same filter
  const mobileRoutes = routes.map((route) => {
    if (!route.collapse) return route;
    return {
      ...route,
      collapse: route.collapse.filter((item) => !(item.guestOnly && user)),
    };
  });

  return (
    <>
      <style>{`
        .radr-nav-link {
          position: relative; display: inline-flex; align-items: center; gap: 4px;
          padding: 7px 13px; border-radius: 9px; text-decoration: none; cursor: pointer;
          color: #1a1a1a; font-size: 13.5px; font-weight: 500; letter-spacing: -0.15px;
          transition: background 180ms ease, color 180ms ease;
          white-space: nowrap; user-select: none; background: transparent; border: none; font-family: inherit;
        }
        .radr-nav-link:hover { background: rgba(0,0,0,0.055); color: #000; }
        .radr-nav-link::after {
          content: ''; position: absolute; bottom: 3px; left: 13px; right: 13px;
          height: 1.5px; background: #D94F2B; border-radius: 2px;
          transform: scaleX(0); transition: transform 200ms cubic-bezier(0.4,0,0.2,1); transform-origin: center;
        }
        .radr-nav-link.active::after { transform: scaleX(1); }

        .radr-cta {
          display: inline-flex; align-items: center; gap: 6px; margin-left: 10px;
          background: #D94F2B; color: #fff !important; padding: 8px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: -0.2px;
          transition: background 180ms ease, transform 120ms ease; white-space: nowrap;
        }
        .radr-cta:hover { background: #B83E1F; transform: translateY(-1px); }

        .radr-dropdown {
          position: fixed; z-index: 300; background: #fff;
          border: 0.5px solid rgba(0,0,0,0.1); border-radius: 13px; padding: 6px;
          min-width: 230px; box-shadow: 0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          animation: radrFadeIn 160ms ease forwards;
        }
        @keyframes radrFadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .radr-dropdown-item {
          display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px;
          border-radius: 8px; text-decoration: none; color: #1a1a1a;
          font-size: 13.5px; font-weight: 450; transition: background 150ms ease;
          cursor: pointer; width: 100%; box-sizing: border-box; background: transparent; border: none; font-family: inherit; text-align: left;
        }
        .radr-dropdown-item:hover { background: rgba(217,79,43,0.06); }
        .radr-dropdown-item--danger { color: #D94F2B !important; }
        .radr-dropdown-item--danger:hover { background: rgba(217,79,43,0.08) !important; }
        .radr-dropdown-icon {
          width: 30px; height: 30px; border-radius: 7px; background: #f0f0f0;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .radr-dropdown-item:hover .radr-dropdown-icon { background: rgba(217,79,43,0.12); }
        .radr-dropdown-item--danger .radr-dropdown-icon { background: rgba(217,79,43,0.1); }

        .radr-dropdown-divider { height: 0.5px; background: rgba(0,0,0,0.07); margin: 4px 8px; }

        .radr-mobile-item {
          display: flex; align-items: center; padding: 10px 14px; border-radius: 10px;
          text-decoration: none; color: #111; font-size: 14px; font-weight: 500;
          transition: background 140ms ease; cursor: pointer;
        }
        .radr-mobile-item:hover { background: rgba(0,0,0,0.05); }
        .radr-mobile-child {
          display: flex; align-items: center; padding: 8px 14px 8px 28px; border-radius: 10px;
          text-decoration: none; color: #555; font-size: 13px; transition: background 140ms ease;
        }
        .radr-mobile-child:hover { background: rgba(0,0,0,0.05); color: #111; }

        .radr-hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 9px; cursor: pointer; color: #111;
          transition: background 140ms ease; border: 0.5px solid rgba(0,0,0,0.12); background: transparent;
        }
        .radr-hamburger:hover { background: rgba(0,0,0,0.05); }

        .radr-mobile-collapse { overflow: hidden; max-height: 0; transition: max-height 260ms cubic-bezier(0.4,0,0.2,1); }
        .radr-mobile-collapse.open { max-height: 900px; }

        .radr-avatar-btn {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #D94F2B 0%, #B83E1F 100%);
          color: white !important; display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; cursor: pointer; flex-shrink: 0;
          border: 2px solid rgba(217,79,43,0.4);
          box-shadow: 0 2px 10px rgba(217,79,43,0.45);
          text-decoration: none; transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .radr-avatar-btn:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(217,79,43,0.55); }
      `}</style>

      <nav style={{
        position: "fixed", top: scrolled ? "0.6rem" : "1rem", left: "50%",
        transform: "translateX(-50%)",
        width: scrolled ? "calc(100% - 2rem)" : "calc(100% - 3rem)",
        maxWidth: "1180px", zIndex: 200,
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(24px)", WebkitBackdropFilter: "saturate(180%) blur(24px)",
        borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.06)",
        padding: "0 1.25rem", transition: "all 300ms cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>

          {/* Brand */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src={radrLogo} alt="Artist RADR" style={{ height: "32px", width: "auto", display: "block" }} />
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              {desktopRoutes.map(({ name, href, route, collapse }) => {
                const isActive = route && location.pathname === route;
                if (href) return <a key={name} href={href} target="_blank" rel="noreferrer" className="radr-nav-link">{name}</a>;
                if (collapse) return (
                  <span key={name} className="radr-nav-link"
                    onMouseEnter={(e) => handleDropdownEnter(e, name)}
                    onMouseLeave={handleDropdownLeave}>
                    {name}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.45, marginLeft: "1px" }}>
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                );
                return <Link key={name} to={route || "/"} className={`radr-nav-link${isActive ? " active" : ""}`}>{name}</Link>;
              })}

              {/* Auth area */}
              {user ? (
                <Link to="/profile" className="radr-avatar-btn" title={user.displayName || user.email} style={{ marginLeft: "10px" }}>
                  {initial}
                </Link>
              ) : (
                <>
                  <Link to="/sign-in"
                    style={{ display: "inline-flex", alignItems: "center", padding: "7px 14px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 500, color: "#1a1a1a", textDecoration: "none", marginLeft: "4px", transition: "background 180ms ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.055)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    Sign In
                  </Link>
                  {action && (
                    action.type === "internal"
                      ? <Link to={action.route || "/"} className="radr-cta">{action.label}</Link>
                      : <a href={action.route} target="_blank" rel="noreferrer" className="radr-cta">{action.label}</a>
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
              <button className="radr-hamburger" onClick={() => setMobileOpen((p) => !p)} aria-label="Menu">
                {mobileOpen
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
                }
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {isMobile && (
          <div className={`radr-mobile-collapse${mobileOpen ? " open" : ""}`}>
            <div style={{ paddingBottom: "10px" }}>
              {mobileRoutes.map(({ name, route, href, collapse }) => (
                <MobileNavItem key={name} name={name} route={route} href={href} collapse={collapse} onClose={() => setMobileOpen(false)} />
              ))}

              {user ? (
                <div style={{ margin: "8px 6px 4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* My Profile row */}
                  <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(217,79,43,0.06)", border: "0.5px solid rgba(217,79,43,0.15)", borderRadius: "12px", textDecoration: "none" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #D94F2B 0%, #B83E1F 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, flexShrink: 0 }}>{initial}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>{user.displayName || "My Profile"}</div>
                      <div style={{ fontSize: "11px", color: "#aaa" }}>{user.email}</div>
                    </div>
                  </Link>
                  {/* Sign out — right under profile */}
                  <button onClick={handleLogout} style={{ width: "100%", padding: "11px", background: "transparent", border: "0.5px solid rgba(217,79,43,0.25)", borderRadius: "10px", color: "#D94F2B", fontFamily: "inherit", fontWeight: 600, fontSize: "14px", cursor: "pointer", textAlign: "center" }}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div style={{ margin: "8px 6px 4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to="/sign-in" onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "11px", background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.2)", color: "#D94F2B", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "14px", textAlign: "center" }}>
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "11px", background: "#D94F2B", color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "14px", textAlign: "center" }}>
                    Join RADR
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop dropdown */}
      {dropdownAnchor && activeSection?.collapse && anchorRect && (
        <div className="radr-dropdown"
          style={{ top: anchorRect.bottom + 8, left: anchorRect.left }}
          onMouseEnter={handleDropdownMenuEnter}
          onMouseLeave={handleDropdownMenuLeave}>
          {activeSection.collapse.map((item, i) => {
            // Sign out marker
            if (item.name === "__signout__") return (
              <div key="signout">
                <div className="radr-dropdown-divider" />
                <button className="radr-dropdown-item radr-dropdown-item--danger" onClick={handleLogout}>
                  <div className="radr-dropdown-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 500 }}>Sign Out</div>
                  </div>
                </button>
              </div>
            );

            return item.href ? (
              <a key={item.name} href={item.href} target="_blank" rel="noreferrer" className="radr-dropdown-item">
                <div className="radr-dropdown-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 500, color: "#111" }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: "11.5px", color: "#aaa", marginTop: "1px" }}>{item.description}</div>}
                </div>
              </a>
            ) : (
              <Link key={item.name} to={item.route || "/"} className="radr-dropdown-item">
                <div className="radr-dropdown-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 500, color: "#111" }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: "11.5px", color: "#aaa", marginTop: "1px" }}>{item.description}</div>}
                </div>
              </Link>
            );
          })}
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
        <div className="radr-mobile-item" onClick={() => setOpen((p) => !p)} style={{ justifyContent: "space-between" }}>
          <span>{name}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease", opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div className={`radr-mobile-collapse${open ? " open" : ""}`}>
          {collapse.map((child) =>
            child.href
              ? <a key={child.name} href={child.href} target="_blank" rel="noreferrer" className="radr-mobile-child" onClick={onClose}>{child.name}</a>
              : <Link key={child.name} to={child.route || "/"} className="radr-mobile-child" onClick={onClose}>{child.name}</Link>
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

export default Navbar;