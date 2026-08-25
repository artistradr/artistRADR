const F = { d: "var(--font-display)", b: "var(--font-body)" };

function HomeHowItWorks() {
  return (
    <>
      <style>{`
        .h-section-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #D94F2B; margin-bottom: 8px; }
        .h-section-title { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #111; margin: 0; line-height: 1.1; }
        .h-hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .h-hiw-swipe-hint { display: none; }
        @media (max-width: 700px) {
          .h-hiw-grid {
            display: flex;
            flex-direction: row;
            gap: 12px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 12px;
            scrollbar-width: none;
          }
          .h-hiw-grid::-webkit-scrollbar { display: none; }
          .h-hiw-card {
            flex: 0 0 78vw;
            max-width: 300px;
            scroll-snap-align: start;
          }
          .h-hiw-swipe-hint { display: block; }
        }
        @media (max-width: 900px) {
          .h-hiw-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <section style={{ padding: "80px 0 60px", background: "#f7f6f3" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div className="h-section-label">How it works</div>
            <h2 className="h-section-title">Get on the RADR in 3 steps</h2>
          </div>

          <div className="h-hiw-grid">
            {[
              {
                num: "01", title: "Submit Your Track",
                desc: "Fill out our quick submission form with your track details and links. Takes under 2 minutes.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
              },
              {
                num: "02", title: "We Review & Curate",
                desc: "Our editorial team listens and selects standout tracks for features, playlists, and spotlights.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
              },
              {
                num: "03", title: "Get Discovered",
                desc: "Your music reaches thousands of listeners, curators, and music lovers across the platform.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
              },
            ].map(({ num, title, desc, icon }) => (
              <div key={num} className="h-hiw-card" style={{ background: "white", borderRadius: "20px", border: "0.5px solid rgba(0,0,0,0.07)", padding: "36px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "20px", right: "20px", fontFamily: F.d, fontSize: "3.5rem", fontWeight: 800, color: "rgba(0,0,0,0.04)", lineHeight: 1, letterSpacing: "-2px" }}>{num}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", background: "rgba(217,79,43,0.08)", border: "0.5px solid rgba(217,79,43,0.2)", borderRadius: "100px", padding: "3px 10px", marginBottom: "16px" }}>
                  Step {num}
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#D94F2B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 4px 14px rgba(217,79,43,0.35)" }}>{icon}</div>
                <div style={{ fontFamily: F.d, fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "10px" }}>{title}</div>
                <p style={{ fontSize: "13.5px", color: "#888", lineHeight: 1.7, fontWeight: 300, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontSize: "11px", color: "#bbb", fontWeight: 400, letterSpacing: "0.5px" }} className="h-hiw-swipe-hint">
              Swipe to see all steps →
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeHowItWorks;