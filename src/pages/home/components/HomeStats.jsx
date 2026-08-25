import { SITE_STATS } from "../../../data/siteStats";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeStats() {
  const stats = [
    { ...SITE_STATS.artistsDiscovered, color: "#D94F2B" },
    { ...SITE_STATS.monthlyListeners,  color: "#4DD9D0" },
    { ...SITE_STATS.curatedPlaylists,  color: "#D94F2B" },
    { ...SITE_STATS.creatorRating,     color: "#4DD9D0" },
  ];

  return (
    <>
      <style>{`
        .h-stats { background: #0E0E0E; padding: 0; }
        .h-stats-inner { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; display: grid; grid-template-columns: repeat(4,1fr); }
        .h-stat { padding: 36px 28px; border-right: 0.5px solid rgba(255,255,255,0.06); text-align: center; transition: background 200ms ease; }
        .h-stat:last-child { border-right: none; }
        .h-stat:hover { background: rgba(217,79,43,0.06); }
        .h-stat-num { font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; letter-spacing: 1px; line-height: 1; margin-bottom: 6px; }
        .h-stat-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); }
        @media (max-width: 900px) {
          .h-stats-inner { grid-template-columns: repeat(2,1fr); }
          .h-stat { border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        }
        @media (max-width: 600px) {
          .h-stats-inner { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <section className="h-stats">
        <div className="h-stats-inner">
          {stats.map(({ value, label, color }) => (
            <div className="h-stat" key={label}>
              <div className="h-stat-num" style={{ color }}>{value}</div>
              <div className="h-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default HomeStats;