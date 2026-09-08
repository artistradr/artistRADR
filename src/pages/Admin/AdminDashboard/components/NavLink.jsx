import { Link } from "react-router-dom";
import { F } from "../constants";

export default function NavLink({ to, label, icon, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        marginBottom: "4px",
        textDecoration: "none",
        color: active ? "white" : "rgba(255,255,255,0.55)",
        fontFamily: F.b,
        fontSize: "13.5px",
        fontWeight: 500,
        background: active ? "rgba(217,79,43,0.15)" : "transparent",
      }}
    >
      <span style={{ fontSize: "15px" }}>{icon}</span>
      {label}
    </Link>
  );
}