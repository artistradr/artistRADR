export default function HowItWorks() {
  return (
    <div style={{ background:"white",border:"0.5px solid rgba(0,0,0,0.07)",borderRadius:"14px",padding:"18px 22px",marginBottom:"24px",display:"flex",gap:"14px",alignItems:"flex-start" }}>
      <div style={{ width:"34px",height:"34px",borderRadius:"10px",background:"#111",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"0.8rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#111",marginBottom:"4px" }}>How it works</div>
        <p style={{ fontSize:"13px",color:"#777",lineHeight:1.65,fontWeight:300,margin:0 }}>
          <strong style={{ fontWeight:600,color:"#555" }}>Spotify</strong> — one click follows everything automatically via OAuth.{" "}
          <strong style={{ fontWeight:600,color:"#555" }}>Instagram</strong> — follow manually, confirm with a checkbox.{" "}
          <strong style={{ fontWeight:600,color:"#555" }}>YouTube</strong> — subscribe on YouTube first, then verify via Google OAuth. Once all 3 are done, the submission form unlocks.
        </p>
      </div>
    </div>
  );
}
