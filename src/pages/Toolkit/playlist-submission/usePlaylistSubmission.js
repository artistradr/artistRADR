import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../supabaseClient";
import { STEPS } from "./steps";
import { openOAuthPopup, callAPI } from "./oauth";

// What to tell the user when the Artist RADR follow itself fails. `reason` comes from the server.
function spotifyFollowError(reason) {
  if (reason === "not_registered") {
    return "We're still opening Spotify connections to everyone and this account isn't enabled yet. Please contact us and we'll get you added.";
  }
  if (reason === "rate_limited") {
    return "Spotify is busy right now. Wait a few seconds and try again.";
  }
  return "We couldn't follow Artist RADR on Spotify. Please try again.";
}

// All the state and actions for the playlist submission flow.
// The Spotify and YouTube verified flags are NOT sent on submit: the database is meant to set
// them from the server's own records (enforce_submission_verification trigger).
// Instagram can't be checked by the server, so that flag is self-reported.
export default function usePlaylistSubmission(user) {
  const [currentStep, setCurrentStep]   = useState(0);
  const [followStatus, setFollowStatus] = useState({});
  const [honorChecked, setHonorChecked] = useState({});
  const [ytSubscribed, setYtSubscribed] = useState(false);
  const [loading, setLoading]           = useState(null);
  const [verified, setVerified]         = useState({});
  const [error, setError]               = useState(null);
  const [optChecked, setOptChecked]     = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const allUnlocked = currentStep >= STEPS.length;
  const progressPct = Math.round((currentStep / STEPS.length) * 100);

  const stepComplete = useCallback((idx) => {
    const step = STEPS[idx];
    if (!step) return false;
    if (step.mode === "honor")        return step.items.every((i) => honorChecked[i.key]);
    if (step.mode === "oauth-follow") return step.items.every((i) => followStatus[i.key] === true);
    if (step.mode === "oauth-check")  return step.items.every((i) => followStatus[i.key] === true);
    return false;
  }, [followStatus, honorChecked]);

  useEffect(() => {
    if (currentStep < STEPS.length && stepComplete(currentStep)) {
      const t = setTimeout(() => { setCurrentStep((s) => s + 1); setError(null); }, 800);
      return () => clearTimeout(t);
    }
  }, [followStatus, honorChecked, currentStep, stepComplete]);

  const handleOAuth = async (step) => {
    setError(null);
    setLoading(step.id);

    const result = await openOAuthPopup(step.id);

    if (result.error === "denied") {
      // Provider itself returned ?error=... — the user explicitly declined
      // consent, or the provider rejected the request outright.
      setError(
        step.id === "youtube"
          ? "Google declined the request. Please try again and approve access to your subscriptions."
          : "Spotify declined the request. Please try again and approve the requested permissions."
      );
      setLoading(null);
      return;
    }

    if (result.error === "closed") {
      // Popup closed (or timed out) with no message ever received. Could be
      // a genuine manual close, or a silent postMessage delivery failure —
      // most commonly an opener/popup origin mismatch locally (see
      // MIGRATION.md Section 18: app must be loaded at 127.0.0.1:5173, not
      // localhost:5173, or the callback page's postMessage never arrives).
      setError(
        "Authentication window closed before completing. If you completed the Spotify/Google screen and still see this, make sure you're viewing this site at 127.0.0.1:5173 rather than localhost:5173 — otherwise try again."
      );
      setLoading(null);
      return;
    }

    const apiResult = await callAPI(step.id, result.code);
    if (!apiResult) { setError("Could not connect. Please try again."); setLoading(null); return; }
    const followed = apiResult.followed ?? {};
    setFollowStatus((p) => ({ ...p, ...followed }));
    setVerified((p) => ({ ...p, [step.id]: true }));
    const allFollowed = step.items.every((i) => followed[i.key]);
    if (!allFollowed) {
      setError(step.id === "youtube"
        ? "Subscription not found. Make sure you subscribed on YouTube first, then verify again."
        : spotifyFollowError(apiResult.reason));
    }
    setLoading(null);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("playlist_submissions").insert({
        submitted_by: user?.id || null,
        instagram_verified: !!honorChecked.instagram,
        payload: {
          ...form,
          optionalFollows: Object.keys(optChecked).filter((k) => optChecked[k]),
        },
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (e) { console.error(e); setError("Submission failed. Please try again."); }
    setSubmitting(false);
  };

  return {
    currentStep, followStatus, honorChecked, setHonorChecked, ytSubscribed, setYtSubscribed,
    loading, verified, error, optChecked, setOptChecked, submitting, submitted,
    allUnlocked, progressPct, stepComplete, handleOAuth, handleSubmit,
  };
}
