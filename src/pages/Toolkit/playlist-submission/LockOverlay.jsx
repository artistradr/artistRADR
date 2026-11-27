import { LOCK_CSS } from "./styles";

const BENEFITS = [
  "Submit tracks to RADR curated playlists",
  "Spotify follows done automatically via OAuth",
  "YouTube subscription verified via Google OAuth",
  "Completely free — no credit card needed",
];

export default function LockOverlay({ onUnlock }) {
  return (
    <>
      <style>{LOCK_CSS}</style>
      <div className="lock-overlay">
        <div className="lock-blur-bg" />
        <div className="lock-card">
          <div style={{ width:"64px",height:"64px",borderRadius:"20px",background:"linear-gradient(135deg,#111,#2a2a2a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ display:"inline-flex",alignItems:"center",gap:"7px",fontSize:"10px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",color:"#D94F2B",background:"rgba(217,79,43,0.08)",border:"0.5px solid rgba(217,79,43,0.2)",borderRadius:"100px",padding:"5px 14px",marginBottom:"18px" }}>
            <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:"#D94F2B",display:"inline-block" }} /> Members Only
          </div>
          <div style={{ fontFamily:"var(--font-display)",fontSize:"1.5rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"2px",lineHeight:1.1,color:"#111",marginBottom:"12px" }}>
            Playlist<br />Submission
          </div>
          <p style={{ fontSize:"14px",color:"#777",fontWeight:300,lineHeight:1.75,maxWidth:"340px",margin:"0 auto 28px" }}>
            Create a free RADR account or sign in to access playlist submissions and start getting your music heard.
          </p>
          <div style={{ background:"#f7f6f3",borderRadius:"14px",padding:"16px 20px",marginBottom:"28px",textAlign:"left" }}>
            {BENEFITS.map((b, i, arr) => (
              <div key={b} style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom: i < arr.length - 1 ? "10px" : 0 }}>
                <div style={{ width:"18px",height:"18px",borderRadius:"50%",background:"rgba(217,79,43,0.1)",border:"0.5px solid rgba(217,79,43,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#D94F2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize:"12px",color:"#555" }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
            <button className="lock-btn" style={{ background:"#111",color:"white" }} onClick={() => onUnlock("register")}>Create Free Account</button>
            <button className="lock-btn" style={{ background:"transparent",color:"#555",border:"0.5px solid rgba(0,0,0,0.12)" }} onClick={() => onUnlock("signin")}>Sign In</button>
          </div>
        </div>
      </div>
    </>
  );
}
