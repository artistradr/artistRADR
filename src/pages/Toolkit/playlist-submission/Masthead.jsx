import { STEPS } from "./steps";

export default function Masthead({ lockStyle, allUnlocked, currentStep, progressPct }) {
  return (
    <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"110px 1.5rem 0", ...lockStyle }}>
      <div style={{ borderBottom:"0.5px solid rgba(0,0,0,0.1)", paddingBottom:"28px", marginBottom:"40px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"20px" }}>
          <div>
            <div style={{ fontSize:"10px", fontWeight:600, letterSpacing:"3px", textTransform:"uppercase", color:"#D94F2B", marginBottom:"8px" }}>
              Artist RADR · Playlist Submission
            </div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2.8rem,6vw,4.5rem)", fontWeight:800, textTransform:"uppercase", letterSpacing:"2px", lineHeight:1, color:"#111", margin:0 }}>
              Get Your Music<br />On RADR Playlists
            </h1>
          </div>
          <div style={{ maxWidth:"320px" }}>
            <p style={{ fontSize:"14px", color:"#888", fontWeight:300, lineHeight:1.7, margin:"0 0 16px" }}>
              RADR curates playlists for emerging and independent artists. Complete 3 steps to unlock the submission form.
            </p>
            <div style={{ maxWidth:"280px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <span style={{ fontSize:"11px", fontWeight:600, color:"#aaa" }}>
                  {allUnlocked ? "All steps complete — form unlocked" : `Step ${Math.min(currentStep+1,STEPS.length)} of ${STEPS.length}`}
                </span>
                <span style={{ fontSize:"12px", fontWeight:800, color:allUnlocked?"#22c55e":"#D94F2B" }}>{progressPct}%</span>
              </div>
              <div className="ps-prog-track"><div className="ps-prog-fill" style={{ width:`${progressPct}%` }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
