// src/studio/StudioHome.jsx
import { Link } from "react-router-dom";
import { MODULES } from "./modules";

const STATUS_LABEL = { live: "Live", next: "Up next", planned: "Planned" };

export default function StudioHome() {
  return (
    <>
      <h1 className="rs-h1">RADR Studio</h1>
      <p className="rs-sub">
        Discover. Spotlight. Amplify. Your workspace for finding new music, curating playlists,
        creating content and publishing it, with you approving every public change.
      </p>

      <div className="rs-flow">
        <span>Discovery</span>
        <i>→</i>
        <span>Editorial selection</span>
        <i>→</i>
        <span>Playlist draft</span>
        <i>→</i>
        <span>Approved sync</span>
      </div>

      <div className="rs-grid">
        {MODULES.map(({ id, label, path, Icon, status, tagline }) => (
          <Link key={id} to={path} className="rs-card">
            <div className="rs-card-top">
              <Icon />
              <span className={`rs-chip ${status}`}>{STATUS_LABEL[status]}</span>
            </div>
            <h3>{label}</h3>
            <p>{tagline}</p>
          </Link>
        ))}
      </div>
    </>
  );
}