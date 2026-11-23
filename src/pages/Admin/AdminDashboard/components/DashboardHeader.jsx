// src/pages/Admin/AdminDashboard/components/DashboardHeader.jsx
import { Link } from "react-router-dom";
import { F } from "../constants";
import StatCard from "./StatCard";

// The "back to Studio" link only exists in the studio.artistradr.com build.
const IS_STUDIO = import.meta.env.VITE_APP_MODE === "studio";

export default function DashboardHeader({ posts, subs, openCount, approvedCount, rejectedCount }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-red)", marginBottom: "6px" }}>Admin</div>
          <h1 style={{ fontFamily: F.d, fontSize: "1.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Dashboard</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {IS_STUDIO && (
            <Link to="/studio" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "transparent", color: "white", padding: "11px 22px", borderRadius: "10px", border: "0.5px solid rgba(255,255,255,0.25)", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              ← RADR Studio
            </Link>
          )}
          <Link to="/admin/new" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "var(--color-red)", color: "white", padding: "11px 22px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            + New Post
          </Link>
        </div>
      </div>

      <div className="adm-stats" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "28px" }}>
        <StatCard label="Total Posts" val={posts.length} />
        <StatCard label="Published" val={posts.filter((p) => p.status === "published").length} />
        <StatCard label="Drafts" val={posts.filter((p) => p.status === "draft").length} />
        <StatCard label="Submissions" val={subs.length} accent="#4DD9D0" />
        <StatCard label="Open" val={openCount} accent="#D94F2B" />
        <StatCard label="Approved" val={approvedCount} accent="#22c55e" />
        <StatCard label="Rejected" val={rejectedCount} accent="#ff6b6b" />
      </div>
    </>
  );
}