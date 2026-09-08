import { F } from "../constants";

export default function StatCard({ label, val, accent }) {
  return (
    <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px 20px" }}>
      <div style={{ fontFamily: F.d, fontSize: "1.8rem", fontWeight: 800, color: accent || "var(--color-red)", lineHeight: 1, marginBottom: "4px" }}>
        {val}
      </div>
      <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}