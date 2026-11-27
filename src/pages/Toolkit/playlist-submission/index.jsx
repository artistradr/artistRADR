import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { useAuthGate } from "context/AuthGateContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import usePlaylistSubmission from "./usePlaylistSubmission";
import { STEPS } from "./steps";
import { PAGE_CSS } from "./styles";
import LockOverlay from "./LockOverlay";
import Masthead from "./Masthead";
import HowItWorks from "./HowItWorks";
import UnlockedCard from "./UnlockedCard";
import StepCard from "./StepCard";
import OptionalFollows from "./OptionalFollows";
import SidePanel from "./SidePanel";

const LOCK_BENEFITS = [
  "Submit tracks to RADR curated playlists",
  "Spotify follows done automatically via OAuth",
  "YouTube subscription verified via Google OAuth",
  "Free — no credit card needed",
];

export default function PlaylistSubmissionPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { requireAuth } = useAuthGate();
  const flow = usePlaylistSubmission(user);

  const isLocked = !authLoading && !user;
  const lockStyle = {
    filter: isLocked ? "blur(2px)" : "none",
    pointerEvents: isLocked ? "none" : "auto",
    userSelect: isLocked ? "none" : "auto",
    transition: "filter 300ms",
  };

  const handleLockCTA = (mode) => {
    requireAuth(null, {
      title: "Playlist Submission",
      description: "Create a free RADR account or sign in to submit your track for playlist consideration.",
      benefits: LOCK_BENEFITS,
      defaultMode: mode,
    });
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="ps-page" style={{ position:"relative" }}>
        <Navbar routes={routes} action={{ type:"internal", route:"/submit-track", label:"Submit Track" }} />
        {isLocked && <LockOverlay onUnlock={handleLockCTA} />}

        <Masthead lockStyle={lockStyle} allUnlocked={flow.allUnlocked} currentStep={flow.currentStep} progressPct={flow.progressPct} />

        <div className="ps-body" style={lockStyle}>
          <div>
            <HowItWorks />
            {flow.allUnlocked && (
              <UnlockedCard onSubmit={flow.handleSubmit} submitting={flow.submitting} submitted={flow.submitted} />
            )}
            {!flow.allUnlocked && STEPS.map((step, idx) => (
              <StepCard key={step.id} step={step} idx={idx} flow={flow} />
            ))}
            <OptionalFollows optChecked={flow.optChecked} setOptChecked={flow.setOptChecked} />
          </div>
          <SidePanel currentStep={flow.currentStep} stepComplete={flow.stepComplete} user={user} />
        </div>

        <Footer />
      </div>
    </>
  );
}
