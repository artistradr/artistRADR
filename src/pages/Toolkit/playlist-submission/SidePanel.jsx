import { STEPS } from "./steps";

const CARD = { marginTop:"16px",padding:"16px",background:"#f7f6f3",borderRadius:"12px",border:"0.5px solid rgba(0,0,0,0.06)" };
const CARD_TITLE = { fontFamily:"var(--font-display)",fontSize:"0.75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#111",marginBottom:"8px" };
const CARD_TEXT = { fontSize:"12px",color:"#888",fontWeight:300,lineHeight:1.65,margin:0 };

const MODE_TEXT = {
  "oauth-follow": "Follows performed automatically via OAuth",
  "honor":        "Self-confirmed — click link, check the box",
  "oauth-check":  "Subscribe manually, then verify via Google OAuth",
};

export default function SidePanel({ currentStep, stepComplete, user }) {
  return (
    <div className="ps-right">
      <div className="ps-panel">
        <div style={{ fontFamily:"var(--font-display)",fontSize:"0.8rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",color:"#111",marginBottom:"6px" }}>What happens next</div>
        <p style={{ fontSize:"13px",color:"#888",fontWeight:300,lineHeight:1.65,marginBottom:"24px" }}>Complete all 3 steps to unlock the form. Our A&R team reviews every track personally.</p>
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentStep || stepComplete(idx);
          const isActive   = idx === currentStep;
          const { Icon }   = step;
          return (
            <div key={step.id} className="ps-panel-step">
              <div className="ps-panel-dot" style={{ background:isComplete?"#22c55e":isActive?step.color:"#ddd" }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px" }}>
                  <div style={{ color:isComplete?"#22c55e":isActive?step.color:"#ccc" }}><Icon size={14} /></div>
                  <span style={{ fontFamily:"var(--font-display)",fontSize:"0.75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px",color:isComplete?"#15803d":isActive?"#111":"#bbb" }}>{step.label}</span>
                  {isComplete && <span style={{ marginLeft:"auto",fontSize:"10px",fontWeight:700,color:"#22c55e" }}>✓ Done</span>}
                  {isActive && !isComplete && <span style={{ marginLeft:"auto",fontSize:"10px",fontWeight:600,color:step.color,background:step.colorDim,padding:"2px 8px",borderRadius:"100px" }}>Active</span>}
                </div>
                <div style={{ fontSize:"12px",color:"#aaa",fontWeight:300 }}>{MODE_TEXT[step.mode]}</div>
              </div>
            </div>
          );
        })}
        <div style={{ ...CARD, marginTop:"24px" }}>
          <div style={CARD_TITLE}>Review timeline</div>
          <p style={CARD_TEXT}>Our team reviews within <strong style={{ fontWeight:600,color:"#555" }}>5–7 business days</strong>. You'll hear back via email regardless of outcome.</p>
        </div>
        <div style={CARD}>
          <div style={CARD_TITLE}>Privacy</div>
          <p style={CARD_TEXT}>
            Spotify OAuth follows on your behalf. YouTube OAuth only reads your subscription status. We never see passwords, store tokens, or post on your behalf.
          </p>
        </div>
        {user && (
          <div style={{ marginTop:"16px",padding:"12px 16px",background:"rgba(34,197,94,0.06)",borderRadius:"12px",border:"0.5px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#22c55e",flexShrink:0 }} />
            <span style={{ fontSize:"12px",color:"#15803d",fontWeight:500 }}>Signed in as {user.user_metadata?.full_name || user.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}
