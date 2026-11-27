import { CheckIcon } from "./icons";
import { FOLLOWS } from "./config";

function YouTubeHint({ ytSubscribed }) {
  if (!ytSubscribed) {
    return (
      <div className="ps-yt-hint">
        <strong style={{ fontWeight:600,color:"#555" }}>Step 1:</strong> Click <em>Subscribe on YouTube</em> below — it opens YouTube with the subscribe button ready. Come back here once subscribed.
      </div>
    );
  }
  return (
    <div className="ps-yt-hint" style={{ background:"#f0fdf4",borderColor:"rgba(34,197,94,0.25)",color:"#15803d" }}>
      <strong style={{ fontWeight:600 }}>Step 2:</strong> Good — now click <em>Verify Subscription via Google</em> to confirm you subscribed.
    </div>
  );
}

function FollowItem({ step, item, done, flow }) {
  const { Icon } = step;
  return (
    <div className={`ps-follow-item${done?" done":""}`}>
      {step.mode === "honor" && (
        <div className={`ps-honor${done?" on":""}`} onClick={() => flow.setHonorChecked((p) => ({ ...p, [item.key]: !p[item.key] }))}>
          {done && <CheckIcon size={10} />}
        </div>
      )}
      <div style={{ width:"36px",height:"36px",borderRadius:"10px",background:done?"#dcfce7":step.colorDim,display:"flex",alignItems:"center",justifyContent:"center",color:done?"#16a34a":step.color,flexShrink:0 }}>
        {done ? <CheckIcon size={16} stroke="#16a34a" /> : <Icon size={18} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"0.78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:done?"#15803d":"#111" }}>{item.label}</div>
        <div style={{ fontSize:"11px",color:"#bbb",marginTop:"2px" }}>{item.sub}</div>
      </div>
      {step.mode === "honor" && (
        <a href={FOLLOWS[item.key]?.url} target="_blank" rel="noreferrer"
          style={{ fontSize:"11px",fontWeight:600,color:done?"#16a34a":step.color,textDecoration:"none",padding:"6px 13px",borderRadius:"8px",background:done?"#dcfce7":step.colorDim,border:`0.5px solid ${done?"rgba(34,197,94,0.3)":step.color+"33"}`,whiteSpace:"nowrap",flexShrink:0 }}>
          {done ? "✓ Following" : "Follow →"}
        </a>
      )}
      {step.mode === "oauth-check" && !done && (
        <a href={FOLLOWS[item.key]?.url} target="_blank" rel="noreferrer" onClick={() => flow.setYtSubscribed(true)}
          style={{ fontSize:"11px",fontWeight:600,color:step.color,textDecoration:"none",padding:"6px 13px",borderRadius:"8px",background:step.colorDim,border:`0.5px solid ${step.color}33`,whiteSpace:"nowrap",flexShrink:0 }}>
          Subscribe on YouTube →
        </a>
      )}
    </div>
  );
}

function StepAction({ step, allDone, isVerified, isLoading, flow }) {
  const { Icon } = step;
  if (step.mode === "oauth-follow") {
    return (
      <button className="ps-btn" style={{ background:allDone&&isVerified?"#22c55e":step.color, color:"white" }} onClick={() => flow.handleOAuth(step)} disabled={!!flow.loading}>
        {isLoading ? <><div className="ps-spinner"/>Following on Spotify…</>
          : isVerified && allDone ? <><CheckIcon size={15}/>Followed — Continue</>
          : isVerified ? <><Icon size={18}/>Retry Spotify</>
          : <><Icon size={18}/>Connect Spotify &amp; Follow All</>}
      </button>
    );
  }
  if (step.mode === "oauth-check") {
    return (
      <button className="ps-btn" style={{ background:allDone?"#22c55e":step.color, color:"white" }} onClick={() => flow.handleOAuth(step)} disabled={!!flow.loading || !flow.ytSubscribed} title={!flow.ytSubscribed ? "Click 'Subscribe on YouTube' first" : ""}>
        {isLoading ? <><div className="ps-spinner"/>Verifying with Google…</>
          : allDone ? <><CheckIcon size={15}/>Verified — Continue</>
          : <><Icon size={18}/>{flow.ytSubscribed ? "Verify Subscription via Google" : "Subscribe on YouTube First ↑"}</>}
      </button>
    );
  }
  return (
    <div style={{ fontSize:"12px",color:allDone?"#16a34a":"#aaa",textAlign:"center",padding:"10px 0",fontWeight:allDone?600:300 }}>
      {allDone ? "✓ Confirmed — advancing to next step…" : "Click 'Follow →' above, then check the box to confirm"}
    </div>
  );
}

export default function StepCard({ step, idx, flow }) {
  const isActive   = idx === flow.currentStep;
  const isComplete = idx < flow.currentStep || flow.stepComplete(idx);
  const isLocked   = idx > flow.currentStep;
  const isLoading  = flow.loading === step.id;
  const isVerified = flow.verified[step.id];
  const allDone    = step.items.every((i) =>
    step.mode === "honor" ? flow.honorChecked[i.key] : flow.followStatus[i.key] === true
  );
  const { Icon } = step;

  return (
    <div className={`ps-step${isActive?" active":""}${isComplete?" done":""}${isLocked?" locked":""}`}>
      <div className="ps-step-header">
        <div className="ps-step-num" style={{ background:isComplete?"#22c55e":isActive?step.color:"rgba(0,0,0,0.06)", color:isComplete||isActive?"white":"#bbb" }}>
          {isComplete ? <CheckIcon size={14} /> : idx + 1}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--font-display)",fontSize:"0.85rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:isComplete?"#15803d":"#111" }}>{step.label}</div>
          <div style={{ fontSize:"11px",color:"#aaa",marginTop:"3px" }}>{step.sublabel}</div>
        </div>
        <div style={{ color:isComplete?"#22c55e":isLocked?"#ccc":step.color }}><Icon size={22} /></div>
      </div>

      {isActive && (
        <div className="ps-step-body">
          <p style={{ fontSize:"13px",color:"#666",lineHeight:1.7,marginBottom:"18px",fontWeight:300,paddingTop:"4px",borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
            {step.description}
          </p>
          {step.mode === "oauth-check" && <YouTubeHint ytSubscribed={flow.ytSubscribed} />}
          {step.items.map((item) => {
            const done = step.mode === "honor" ? !!flow.honorChecked[item.key] : flow.followStatus[item.key] === true;
            return <FollowItem key={item.key} step={step} item={item} done={done} flow={flow} />;
          })}
          {flow.error && (
            <div style={{ background:"#fef2f2",border:"0.5px solid #fecaca",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#dc2626",marginTop:"14px",lineHeight:1.6 }}>
              {flow.error}
            </div>
          )}
          <div style={{ marginTop:"18px", display:"flex", flexDirection:"column", gap:"10px" }}>
            <StepAction step={step} allDone={allDone} isVerified={isVerified} isLoading={isLoading} flow={flow} />
          </div>
        </div>
      )}
    </div>
  );
}
