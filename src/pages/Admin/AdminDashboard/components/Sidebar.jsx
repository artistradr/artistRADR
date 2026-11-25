import { ADMIN_BASE } from "../../adminBase";
import { F } from "../constants";
import NavLink from "./NavLink";

export default function Sidebar({ sidebarOpen, setSidebarOpen, openCount, handleLogout }) {
  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="adm-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 50, width: "40px", height: "40px", alignItems: "center", justifyContent: "center", background: "#161616", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", fontSize: "17px", cursor: "pointer" }}
      >
        ☰
      </button>

      <div className={`adm-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside
        className={`adm-sidebar${sidebarOpen ? " open" : ""}`}
        style={{ width: "240px", background: "#161616", height: "100vh", padding: "32px 20px", borderRight: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 60, overflowY: "auto" }}
      >
        <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "40px" }}>
          <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
        </div>
        <nav style={{ flex: 1 }}>
          <NavLink to={ADMIN_BASE} label="Dashboard" icon="⊞" active={true} onClick={() => setSidebarOpen(false)} />
          <NavLink to={`${ADMIN_BASE}/new`} label="New Post" icon="+" active={false} onClick={() => setSidebarOpen(false)} />
          <NavLink to="/" label="View Site" icon="↗" active={false} onClick={() => setSidebarOpen(false)} />
        </nav>
        <div style={{ marginBottom: "12px" }}>
          {openCount > 0 && (
            <div style={{ background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "8px", fontSize: "12px", color: "var(--color-red)", fontWeight: 600 }}>
              {openCount} open submission{openCount !== 1 ? "s" : ""} pending
            </div>
          )}
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "10px", padding: "10px", fontFamily: F.b, fontSize: "13px", cursor: "pointer", width: "100%" }}>
          Sign Out
        </button>
      </aside>
    </>
  );
}