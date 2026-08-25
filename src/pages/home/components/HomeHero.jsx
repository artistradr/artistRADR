import { Link } from "react-router-dom";
import bgImage from "assets/images/hero.png";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeHero() {
  return (
    <>
      <style>{`
        .h-hero {
          position: relative; min-height: 100vh; width: 100%;
          background-image: url(${bgImage});
          background-size: cover; background-position: center;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .h-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(170deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 60%, rgba(217,79,43,0.18) 100%);
        }
        .h-hero-content {
          position: relative; z-index: 2; text-align: center;
          padding: 0 1.5rem; max-width: 780px; width: 100%;
        }
        .h-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 600; letter-spacing: 2.5px;
          text-transform: uppercase; color: #4DD9D0;
          background: rgba(77,217,208,0.1); border: 0.5px solid rgba(77,217,208,0.3);
          border-radius: 100px; padding: 5px 16px; margin-bottom: 22px;
        }
        .h-eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: #4DD9D0; }
        .h-title {
          font-family: var(--font-display);
          font-size: clamp(2.8rem, 6vw, 5rem);
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1;
          color: white;
          margin: 0 0 20px;
          white-space: nowrap;
        }
        .h-title em { 
          font-style: italic; 
          color: #D94F2B;
          text-transform: none;
        }
        .h-title .radr-text {
          text-transform: uppercase;
        }
        .h-sub { font-size: 1rem; color: rgba(255,255,255,0.72); font-weight: 300; line-height: 1.75; max-width: 480px; margin: 0 auto 36px; }
        .h-hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .h-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #D94F2B; color: white; padding: 13px 28px;
          border-radius: 12px; font-size: 13.5px; font-weight: 600;
          text-decoration: none; box-shadow: 0 4px 20px rgba(217,79,43,0.45);
          transition: background 180ms ease, transform 120ms ease;
        }
        .h-btn-primary:hover { background: #B83E1F; transform: translateY(-2px); }
        .h-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.1); color: white;
          border: 0.5px solid rgba(255,255,255,0.25);
          padding: 13px 28px; border-radius: 12px;
          font-size: 13.5px; font-weight: 600; text-decoration: none;
          transition: background 180ms ease;
        }
        .h-btn-ghost:hover { background: rgba(255,255,255,0.18); }
        .h-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .h-scroll-line { width: 1px; height: 40px; background: linear-gradient(to bottom, rgba(255,255,255,0.6), transparent); animation: scrollPulse 2s ease infinite; }
        @keyframes scrollPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @media (max-width: 600px) {
          .h-title { white-space: normal !important; font-size: clamp(2.2rem, 10vw, 3rem) !important; }
        }
      `}</style>

      <section className="h-hero">
        <div className="h-hero-overlay" />
        <div style={{ position: "absolute", top: 0, right: 0, width: "500px", height: "400px", background: "radial-gradient(ellipse at top right, rgba(77,217,208,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="h-hero-content">
          <div className="h-eyebrow">
            <span className="h-eyebrow-dot" />
            Emerging talent platform
          </div>
          <h1 className="h-title">
            <em>Artist</em> <span className="radr-text">RADR</span>
          </h1>
          <p className="h-sub">
            Spotlighting emerging talent. Discover new artists, sounds, and stories curated just for you.
          </p>
          <div className="h-hero-btns">
            <Link to="/blog" className="h-btn-primary">
              Explore RADR
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/submit-track" className="h-btn-ghost">Submit Track</Link>
          </div>
        </div>
        <div className="h-scroll">
          <div className="h-scroll-line" />
        </div>
      </section>
    </>
  );
}

export default HomeHero;