export default function AdminStyles() {
  return (
    <style>{`
      .adm-row:hover { background: rgba(255,255,255,0.02) !important; }
      .adm-sub-row:hover { background: rgba(255,255,255,0.03) !important; }
      .adm-tab { padding:8px 18px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; white-space:nowrap; }
      .adm-filter { padding:7px 16px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; white-space:nowrap; }
      .adm-hamburger { display:none; }
      .adm-overlay { display:none; }
      .adm-sidebar { transition: transform 220ms ease; }
      .adm-desktop-only { display: flex; }
      .adm-mobile-only { display: none; }
      .adm-main { overflow-x: hidden; }

      @media (max-width: 860px) {
        .adm-stats { grid-template-columns: repeat(3, 1fr) !important; }
      }

      @media (max-width: 768px) {
        .adm-hamburger { display:flex; }
        .adm-sidebar { position:fixed; top:0; left:0; bottom:0; transform: translateX(-100%); z-index:60; }
        .adm-sidebar.open { transform: translateX(0); }
        .adm-overlay.open { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:55; }
        .adm-main { margin-left:0 !important; padding:72px 16px 48px !important; }
        .adm-stats { grid-template-columns: repeat(2, 1fr) !important; gap:10px !important; }
        .adm-scroll-x { overflow-x:auto; -webkit-overflow-scrolling:touch; flex-wrap:nowrap !important; }
        .adm-desktop-only { display: none !important; }
        .adm-mobile-only { display: flex !important; }
      }
    `}</style>
  );
}