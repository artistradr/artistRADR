import { useState } from "react";
import { CheckIcon } from "./icons";

const FIELDS = [
  { key:"artistName",  label:"Artist Name",       placeholder:"Your artist name",                   type:"text" },
  { key:"trackName",   label:"Track Name",         placeholder:"Name of the track",                  type:"text" },
  { key:"genre",       label:"Genre",              placeholder:"e.g. Afrobeats, R&B, Pop",           type:"text" },
  { key:"spotifyLink", label:"Spotify Track Link", placeholder:"https://open.spotify.com/track/...", type:"url" },
  { key:"email",       label:"Email Address",      placeholder:"your@email.com",                     type:"email" },
];

const LABEL_STYLE = { display:"block",fontSize:"11px",fontWeight:600,letterSpacing:"0.8px",textTransform:"uppercase",color:"#555",marginBottom:"6px" };
const INPUT_STYLE = { width:"100%",padding:"11px 14px",borderRadius:"10px",border:"0.5px solid rgba(0,0,0,0.14)",background:"#f7f6f3",fontFamily:"var(--font-body)",fontSize:"13px",color:"#111",outline:"none",boxSizing:"border-box" };

function SubmittedNotice() {
  return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ width:"52px",height:"52px",borderRadius:"50%",background:"rgba(34,197,94,0.1)",border:"0.5px solid rgba(34,197,94,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
        <CheckIcon size={22} stroke="#16a34a" />
      </div>
      <div style={{ fontFamily:"var(--font-display)",fontSize:"1rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"#111",marginBottom:"8px" }}>Submission Received</div>
      <p style={{ fontSize:"13px",color:"#888",fontWeight:300,lineHeight:1.65 }}>Our A&R team will review your track and respond within 5–7 business days.</p>
    </div>
  );
}

export default function SubmissionForm({ onSubmit, submitting, submitted }) {
  const [form, setForm] = useState({ artistName:"", trackName:"", genre:"", spotifyLink:"", email:"", notes:"" });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  if (submitted) return <SubmittedNotice />;

  const canSubmit = form.artistName && form.trackName && form.spotifyLink && form.email;

  return (
    <div style={{ textAlign:"left" }}>
      <div style={{ height:"0.5px",background:"rgba(0,0,0,0.08)",margin:"0 0 24px" }} />
      <div style={{ display:"inline-flex",alignItems:"center",gap:"7px",fontSize:"10px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",color:"#22c55e",background:"rgba(34,197,94,0.08)",border:"0.5px solid rgba(34,197,94,0.25)",borderRadius:"100px",padding:"5px 14px",marginBottom:"20px" }}>
        <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:"#22c55e",display:"inline-block" }} /> Form Unlocked
      </div>
      <div style={{ fontFamily:"var(--font-display)",fontSize:"1.1rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"#111",marginBottom:"4px" }}>Submit Your Track</div>
      <p style={{ fontSize:"13px",color:"#888",fontWeight:300,lineHeight:1.6,marginBottom:"20px" }}>Fill in your track details. Our team reviews every submission personally.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
        {FIELDS.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={LABEL_STYLE}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} style={INPUT_STYLE} />
          </div>
        ))}
        <div>
          <label style={LABEL_STYLE}>Additional Notes</label>
          <textarea placeholder="Anything else you'd like us to know…" value={form.notes} onChange={set("notes")} rows={3}
            style={{ ...INPUT_STYLE, resize:"vertical" }} />
        </div>
      </div>
      <button onClick={() => onSubmit(form)} disabled={submitting || !canSubmit}
        style={{ marginTop:"18px",width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:"#111",color:"white",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:700,cursor:"pointer",opacity:submitting||!canSubmit?0.5:1,letterSpacing:"0.4px" }}>
        {submitting ? "Submitting…" : "Submit Track →"}
      </button>
    </div>
  );
}
