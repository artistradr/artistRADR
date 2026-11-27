import { CheckIcon } from "./icons";
import { OPTIONAL } from "./config";

export default function OptionalFollows({ optChecked, setOptChecked }) {
  return (
    <div style={{ background:"white",border:"0.5px solid rgba(0,0,0,0.07)",borderRadius:"16px",padding:"22px 26px",marginTop:"8px" }}>
      <div style={{ fontSize:"10px",fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase",color:"#ccc",marginBottom:"16px" }}>Also follow us — optional</div>
      <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
        {OPTIONAL.map((opt) => (
          <div key={opt.id} style={{ display:"flex",alignItems:"center",gap:"12px",cursor:"pointer" }} onClick={() => setOptChecked((p) => ({ ...p, [opt.id]: !p[opt.id] }))}>
            <div className={`ps-opt-chk${optChecked[opt.id]?" on":""}`}>{optChecked[opt.id] && <CheckIcon size={9} />}</div>
            <a href={opt.url} target="_blank" rel="noreferrer" style={{ fontSize:"13px",fontWeight:500,color:"#555",textDecoration:"none" }} onClick={(e) => e.stopPropagation()}>Follow on {opt.label}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
