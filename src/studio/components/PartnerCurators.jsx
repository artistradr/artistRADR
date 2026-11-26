// src/studio/components/PartnerCurators.jsx
//
// Placeholder for the partner curator list. Nothing here reads or writes data yet. The idea:
// curators with active playlists can join Artist RADR and earn when campaign songs are
// placed on their playlists. Staff will attach those playlists to campaigns the same way
// they attach RADR's own.

import "./campaignPlaylists.css";

const PLANNED = [
  "Curator list: name, contact, and the playlist links each curator offers",
  "Approve a curator before any of their playlists can be attached to a campaign",
  "Attach a partner playlist to a campaign next to RADR's own, marked as a partner playlist",
  "Record what each curator earns per placement (needs the payments work first)",
  "Only show figures a source actually provides; no invented follower or stream numbers",
];

export default function PartnerCurators() {
  return (
    <section className="cpp-partners">
      <div className="cpl-head">
        <h3 className="cpl-title">Partner curators</h3>
        <span className="rs-chip next">Coming soon</span>
      </div>
      <p className="cpp-partners-text">
        Artist RADR is open to curators with active playlists who want to earn from artist campaigns. This list is
        not built yet. For now, attach playlists RADR runs itself in the "Our playlists" tab.
      </p>
      <ul className="cpp-planned">
        {PLANNED.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
