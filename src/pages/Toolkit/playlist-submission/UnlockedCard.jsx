import { CheckIcon } from "./icons";
import SubmissionForm from "./SubmissionForm";

export default function UnlockedCard({ onSubmit, submitting, submitted }) {
  return (
    <div className="ps-unlock" style={{ marginBottom:"20px" }}>
      <div className="ps-unlock-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
      </div>
      <div style={{ textAlign:"center", marginBottom:"28px" }}>
        <div style={{ display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(34,197,94,0.08)",border:"0.5px solid rgba(34,197,94,0.25)",borderRadius:"100px",padding:"5px 14px",fontSize:"10px",fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase",color:"#16a34a",marginBottom:"16px" }}>
          <CheckIcon size={10} stroke="#16a34a" /> All steps verified
        </div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"1.4rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"#111",marginBottom:"10px" }}>Submission Unlocked</div>
        <p style={{ fontSize:"14px",color:"#777",lineHeight:1.7,fontWeight:300,maxWidth:"380px",margin:"0 auto" }}>
          All steps confirmed. Fill out the form below — our team reviews every track personally and responds within 5–7 business days.
        </p>
      </div>
      <SubmissionForm onSubmit={onSubmit} submitting={submitting} submitted={submitted} />
    </div>
  );
}
