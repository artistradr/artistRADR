// src/studio/StudioLayout.jsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { NAV_ITEMS } from "./modules";
import "./studio.css";

export default function StudioLayout() {
  const [open, setOpen] = useState(false);
  const auth = useSupabaseAuth();

  // The auth context's sign-out function name isn't known here, so look for
  // the common ones. The button only shows if one exists.
  const signOut = auth?.signOut || auth?.logout || auth?.signout;
  const email = auth?.user?.email;

  return (
    <div className="rs-root">
      <aside className={`rs-sidebar${open ? " open" : ""}`}>
        <div className="rs-brand">
          <div className="rs-brand-name">ARTIST RADR</div>
          <span className="rs-brand-tag">STUDIO</span>
        </div>

        <nav className="rs-nav">
          {NAV_ITEMS.map(({ id, label, path, Icon, end }) => (
            <NavLink
              key={id}
              to={path}
              end={end}
              className={({ isActive }) => `rs-nav-link${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="rs-user">
          {email && <div className="rs-user-email">{email}</div>}
          {typeof signOut === "function" && (
            <button type="button" className="rs-signout" onClick={() => signOut()}>
              Sign out
            </button>
          )}
        </div>
      </aside>

      <div
        className={`rs-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="rs-main">
        <div className="rs-topbar">
          <button
            type="button"
            className="rs-menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <strong style={{ letterSpacing: "0.14em", fontSize: 13 }}>ARTIST RADR STUDIO</strong>
        </div>

        <main className="rs-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}