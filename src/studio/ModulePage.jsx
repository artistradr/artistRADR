// src/studio/ModulePage.jsx
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { MODULES } from "./modules";

const STATUS_LABEL = { live: "Live", next: "Up next", planned: "Planned" };

// Placeholder page for a Studio module. When a module is actually built,
// replace its <ModulePage id="..." /> route in App.jsx with the real page.
export default function ModulePage({ id }) {
  const mod = MODULES.find((m) => m.id === id);

  if (!mod) {
    return (
      <>
        <h1 className="rs-h1">Not found</h1>
        <p className="rs-sub">
          That module doesn&apos;t exist. <Link to="/studio">Back to overview</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="rs-head">
        <h1 className="rs-h1">{mod.label}</h1>
        <span className={`rs-chip ${mod.status}`}>{STATUS_LABEL[mod.status]}</span>
        <span className="rs-chip">{mod.phase}</span>
      </div>
      <p className="rs-sub">{mod.tagline}</p>

      <div className="rs-panel">
        <h2>What this will do</h2>
        <p>{mod.description}</p>
      </div>

      {mod.features.length > 0 && (
        <div className="rs-panel">
          <h2>Planned features</h2>
          <ul className="rs-list">
            {mod.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

ModulePage.propTypes = {
  id: PropTypes.string.isRequired,
};