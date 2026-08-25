import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { useAuthGate } from "context/AuthGateContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const FUNCTIONS_BASE = "https://rjivkemajotafjvtalol.supabase.co/functions/v1";
const API = {
  spotify: `${FUNCTIONS_BASE}/follow-on-spotify`,
  youtube: `${FUNCTIONS_BASE}/check-follows-youtube`,
};

const SPOTIFY_CLIENT_ID = "6434dcc723df4a759edd60afbd2f388c";
const SPOTIFY_SCOPES = "user-follow-modify playlist-modify-public playlist-modify-private";

const YOUTUBE_CLIENT_ID = "148558438217-0essbua3gsliuhjt8sbjaho2v8vg4nsn.apps.googleusercontent.com";

const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const SPOTIFY_REDIRECT = IS_LOCAL
  ? "http://127.0.0.1:5173/auth/spotify/callback"
  : "https://artistradr.com/auth/spotify/callback";
const YOUTUBE_REDIRECT = IS_LOCAL
  ? "http://127.0.0.1:5173/auth/youtube/callback"
  : "https://artistradr.com/auth/youtube/callback";

const FOLLOWS = {
  spotify_profile:     { url: "https://open.spotify.com/user/31etosst62tr3hqwcdiepfw3hjk4" },
  spotify_new_music:   { url: "https://open.spotify.com/playlist/3Vq2POEX6IcMsPwvdG6iMv" },
  spotify_discoveries: { url: "https://open.spotify.com/playlist/57Gyugs4KtBVdsJZ18QY6o" },
  spotify_spotlight:   { url: "https://open.spotify.com/playlist/47z1mPJWmcVg9JgHHat8xf" },
  instagram:           { url: "https://www.instagram.com/artistradr" },
  youtube:             { url: "https://www.youtube.com/channel/UCm8zgufhvh8SUEVEXJk8J8Q?sub_confirmation=1" },
};

const SpotifyIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);
const IGIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const YTIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);
const CheckIcon = ({ size = 14, stroke = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const STEPS = [
  {
    id: "spotify", platform: "Spotify", color: "#1DB954", colorDim: "rgba(29,185,84,0.1)",
    label: "Follow on Spotify", sublabel: "Profile + 3 playlists",
    description: "Connect your Spotify account and we'll follow the RADR profile and all 3 curated playlists on your behalf — instantly, with one click. No password shared with us.",
    mode: "oauth-follow", Icon: SpotifyIcon,
    items: [
      { key: "spotify_profile",     label: "RADR Profile",     sub: "Official Artist Account" },
      { key: "spotify_new_music",   label: "New Music Friday",  sub: "Weekly Drops Playlist" },
      { key: "spotify_discoveries", label: "RADR Discoveries",  sub: "Emerging Artists Playlist" },
      { key: "spotify_spotlight",   label: "RADR Spotlight",    sub: "Featured Artists Playlist" },
    ],
  },
  {
    id: "instagram", platform: "Instagram", color: "#E1306C", colorDim: "rgba(225,48,108,0.1)",
    label: "Follow Instagram", sublabel: "@artistradr",
    description: "Follow @artistradr on Instagram to stay connected with the RADR community, editorial drops, and playlist announcements. Confirm your follow below to proceed.",
    mode: "honor", Icon: IGIcon,
    items: [{ key: "instagram", label: "@artistradr", sub: "Official RADR Instagram" }],
  },
  {
    id: "youtube", platform: "YouTube", color: "#FF0000", colorDim: "rgba(255,0,0,0.1)",
    label: "Subscribe on YouTube", sublabel: "@ArtistRADR",
    description: "First click 'Subscribe on YouTube' to open the channel and subscribe. Then click 'Verify Subscription' — we'll confirm via your Google account that you're subscribed.",
    mode: "oauth-check", Icon: YTIcon,
    items: [{ key: "youtube", label: "@ArtistRADR", sub: "Official RADR Channel" }],
  },
];

const OPTIONAL = [
  { id: "twitter",  label: "X / Twitter", url: "https://twitter.com/artistradr" },
  { id: "tiktok",   label: "TikTok",      url: "https://tiktok.com/@artistradr" },
  { id: "facebook", label: "Facebook",    url: "https://facebook.com/artistradr" },
];

// Resolves with { code } on success, or { error } on failure, where error is
// one of: "denied" (user/provider explicitly returned ?error=...), "closed"
// (popup closed or timed out with no message ever received — this covers
// both a genuine cancel with no error param AND a message that silently
// failed to deliver, e.g. an opener/popup origin mismatch). Distinguishing
// these two from a flat `null` return is what lets handleOAuth show a
// specific message instead of one generic "cancelled" string for every case.
function openOAuthPopup(platform) {
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);
  const urls = {
    spotify: `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&state=${state}`,
    youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${state}&access_type=offline&prompt=consent`,
  };
  const popup = window.open(urls[platform], `${platform}_oauth`, "width=520,height=640,scrollbars=yes");
  return new Promise((resolve) => {
    const handler = (e) => {
      if (e.data?.type === `${platform}_oauth_code`) {
        window.removeEventListener("message", handler);
        clearInterval(timer);
        resolve({ code: e.data.code });
      } else if (e.data?.type === `${platform}_oauth_error`) {
        window.removeEventListener("message", handler);
        clearInterval(timer);
        resolve({ error: "denied" });
      }
    };
    window.addEventListener("message", handler);
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.removeEventListener("message", handler);
        resolve({ error: "closed" });
      }
    }, 600);
  });
}

async function callAPI(platform, code) {
  try {
    const res = await fetch(API[platform], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch { return null; }
}

// ─── Lock overlay ─────────────────────────────────────────────────────────────
function LockOverlay({ onUnlock }) {
  return (
    <>
      <style>{`
        @keyframes lockFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .lock-overlay { position:fixed;inset:0;z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:90px 1.5rem 1.5rem;overflow-y:auto; }
        .lock-blur-bg { position:fixed;inset:0;background:rgba(247,246,243,0.75);backdrop-filter:blur(14px); }
        .lock-card { position:relative;background:white;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;border:0.5px solid rgba(0,0,0,0.08);box-shadow:0 24px 60px rgba(0,0,0,0.13);animation:lockFadeUp 380ms cubic-bezier(.175,.885,.32,1.1) both;flex-shrink:0; }
        .lock-btn { width:100%;padding:14px;border-radius:12px;border:none;font-family:var(--font-body);font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms,transform 100ms;letter-spacing:0.3px; }
        .lock-btn:hover{opacity:0.87;transform:translateY(-1px)}
      `}</style>
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
            {[
              "Submit tracks to RADR curated playlists",
              "Spotify follows done automatically via OAuth",
              "YouTube subscription verified via Google OAuth",
              "Completely free — no credit card needed",
            ].map((b, i, arr) => (
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

// ─── Submission form ──────────────────────────────────────────────────────────
function SubmissionForm({ onSubmit, submitting, submitted }) {
  const [form, setForm] = useState({ artistName:"", trackName:"", genre:"", spotifyLink:"", email:"", notes:"" });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  if (submitted) return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ width:"52px",height:"52px",borderRadius:"50%",background:"rgba(34,197,94,0.1)",border:"0.5px solid rgba(34,197,94,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
        <CheckIcon size={22} stroke="#16a34a" />
      </div>
      <div style={{ fontFamily:"var(--font-display)",fontSize:"1rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"#111",marginBottom:"8px" }}>Submission Received</div>
      <p style={{ fontSize:"13px",color:"#888",fontWeight:300,lineHeight:1.65 }}>Our A&R team will review your track and respond within 5–7 business days.</p>
    </div>
  );

  const fields = [
    { key:"artistName",  label:"Artist Name",       placeholder:"Your artist name",                   type:"text" },
    { key:"trackName",   label:"Track Name",         placeholder:"Name of the track",                  type:"text" },
    { key:"genre",       label:"Genre",              placeholder:"e.g. Afrobeats, R&B, Pop",           type:"text" },
    { key:"spotifyLink", label:"Spotify Track Link", placeholder:"https://open.spotify.com/track/...", type:"url" },
    { key:"email",       label:"Email Address",      placeholder:"your@email.com",                     type:"email" },
  ];

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
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={{ display:"block",fontSize:"11px",fontWeight:600,letterSpacing:"0.8px",textTransform:"uppercase",color:"#555",marginBottom:"6px" }}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)}
              style={{ width:"100%",padding:"11px 14px",borderRadius:"10px",border:"0.5px solid rgba(0,0,0,0.14)",background:"#f7f6f3",fontFamily:"var(--font-body)",fontSize:"13px",color:"#111",outline:"none",boxSizing:"border-box" }} />
          </div>
        ))}
        <div>
          <label style={{ display:"block",fontSize:"11px",fontWeight:600,letterSpacing:"0.8px",textTransform:"uppercase",color:"#555",marginBottom:"6px" }}>Additional Notes</label>
          <textarea placeholder="Anything else you'd like us to know…" value={form.notes} onChange={set("notes")} rows={3}
            style={{ width:"100%",padding:"11px 14px",borderRadius:"10px",border:"0.5px solid rgba(0,0,0,0.14)",background:"#f7f6f3",fontFamily:"var(--font-body)",fontSize:"13px",color:"#111",outline:"none",resize:"vertical",boxSizing:"border-box" }} />
        </div>
      </div>
      <button onClick={() => onSubmit(form)} disabled={submitting || !canSubmit}
        style={{ marginTop:"18px",width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:"#111",color:"white",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:700,cursor:"pointer",opacity:submitting||!canSubmit?0.5:1,letterSpacing:"0.4px" }}>
        {submitting ? "Submitting…" : "Submit Track →"}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PlaylistSubmissionPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { requireAuth } = useAuthGate();

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
  const isLocked    = !authLoading && !user;

  const handleLockCTA = (mode) => {
    requireAuth(null, {
      title: "Playlist Submission",
      description: "Create a free RADR account or sign in to submit your track for playlist consideration.",
      benefits: [
        "Submit tracks to RADR curated playlists",
        "Spotify follows done automatically via OAuth",
        "YouTube subscription verified via Google OAuth",
        "Free — no credit card needed",
      ],
      defaultMode: mode,
    });
  };

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

    const code = result.code;
    const apiResult = await callAPI(step.id, code);
    if (!apiResult) { setError("Could not connect. Please try again."); setLoading(null); return; }
    setFollowStatus((p) => ({ ...p, ...apiResult.followed }));
    setVerified((p) => ({ ...p, [step.id]: true }));
    const allFollowed = step.items.every((i) => apiResult.followed[i.key]);
    if (!allFollowed) {
      setError(step.id === "youtube"
        ? "Subscription not found. Make sure you subscribed on YouTube first, then verify again."
        : "Some follows failed. Please try again — this is usually a temporary Spotify issue.");
    }
    setLoading(null);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("playlist_submissions").insert({
        submitted_by: user?.id || null,
        spotify_verified: !!followStatus.spotify_profile,
        instagram_verified: !!honorChecked.instagram,
        youtube_verified: !!followStatus.youtube,
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

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes unlockPulse { 0%,100%{box-shadow:0 0 0 0 rgba(217,79,43,0)} 50%{box-shadow:0 0 0 8px rgba(217,79,43,0.12)} }
        .ps-page { animation:fadeUp 400ms ease both; font-family:var(--font-body); background:#f7f6f3; min-height:100vh; display:flex; flex-direction:column; }
        .ps-body { max-width:1100px; margin:0 auto; padding:0 2rem 100px; display:grid; grid-template-columns:1fr 400px; gap:60px; align-items:start; }
        @media(max-width:900px){ .ps-body{ grid-template-columns:1fr; gap:40px; } }
        .ps-right { position:sticky; top:100px; }
        .ps-step { border-radius:16px; border:0.5px solid rgba(0,0,0,0.08); background:white; margin-bottom:12px; overflow:hidden; transition:border-color 200ms,box-shadow 200ms; }
        .ps-step.active { border-color:rgba(0,0,0,0.15); box-shadow:0 6px 30px rgba(0,0,0,0.08); }
        .ps-step.done { border-color:rgba(34,197,94,0.3); background:#fafffe; }
        .ps-step.locked { opacity:0.4; pointer-events:none; }
        .ps-step-header { display:flex; align-items:center; gap:16px; padding:20px 24px; }
        .ps-step-num { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:13px; font-weight:800; flex-shrink:0; transition:background 300ms; }
        .ps-step-body { padding:0 24px 24px; animation:fadeUp 250ms ease both; }
        .ps-follow-item { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:11px; background:#f7f6f3; border:0.5px solid rgba(0,0,0,0.06); margin-bottom:8px; transition:background 200ms,border-color 200ms; }
        .ps-follow-item.done { background:#f0fdf4; border-color:rgba(34,197,94,0.25); }
        .ps-btn { width:100%; padding:14px; border-radius:12px; border:none; font-family:var(--font-body); font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:opacity 150ms,transform 100ms; letter-spacing:0.4px; }
        .ps-btn:hover:not(:disabled){ opacity:0.87; transform:translateY(-1px); }
        .ps-btn:disabled{ opacity:0.5; cursor:not-allowed; }
        .ps-spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:white; animation:spin 700ms linear infinite; flex-shrink:0; }
        .ps-prog-track { height:3px; border-radius:100px; background:rgba(0,0,0,0.07); overflow:hidden; }
        .ps-prog-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#D94F2B,#4DD9D0); transition:width 700ms cubic-bezier(.4,0,.2,1); }
        .ps-honor { width:22px; height:22px; border-radius:7px; border:1.5px solid rgba(0,0,0,0.18); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 150ms; }
        .ps-honor.on { background:#E1306C; border-color:#E1306C; }
        .ps-opt-chk { width:18px; height:18px; border-radius:5px; border:1.5px solid rgba(0,0,0,0.16); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 150ms; }
        .ps-opt-chk.on { background:#111; border-color:#111; }
        .ps-unlock { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:20px; padding:40px 36px; animation:fadeUp 400ms ease both; }
        .ps-unlock-icon { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#D94F2B,#e8633c); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation:unlockPulse 2s ease infinite; }
        .ps-panel { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:20px; padding:32px; }
        .ps-panel-step { display:flex; align-items:flex-start; gap:14px; padding:14px 0; border-bottom:0.5px solid rgba(0,0,0,0.06); }
        .ps-panel-step:last-child { border-bottom:none; padding-bottom:0; }
        .ps-panel-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:6px; }
        .ps-yt-hint { font-size:12px; color:#888; background:#fff8f0; border:0.5px solid rgba(255,150,0,0.2); border-radius:10px; padding:10px 14px; margin-bottom:12px; line-height:1.6; }
      `}</style>

      <div className="ps-page" style={{ position:"relative" }}>
        <Navbar routes={routes} action={{ type:"internal", route:"/submit-track", label:"Submit Track" }} />

        {isLocked && <LockOverlay onUnlock={handleLockCTA} />}

        {/* ══ MASTHEAD — blog editorial style ══ */}
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"110px 2rem 0", filter:isLocked?"blur(2px)":"none", pointerEvents:isLocked?"none":"auto", userSelect:isLocked?"none":"auto", transition:"filter 300ms" }}>
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

        {/* Body */}
        <div className="ps-body" style={{ filter:isLocked?"blur(2px)":"none", pointerEvents:isLocked?"none":"auto", userSelect:isLocked?"none":"auto", transition:"filter 300ms" }}>
          <div>
            {/* How it works */}
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

            {/* Unlocked */}
            {allUnlocked && (
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
                <SubmissionForm onSubmit={handleSubmit} submitting={submitting} submitted={submitted} />
              </div>
            )}

            {/* Steps */}
            {!allUnlocked && STEPS.map((step, idx) => {
              const isActive   = idx === currentStep;
              const isComplete = idx < currentStep || stepComplete(idx);
              const isLocked2  = idx > currentStep;
              const isLoading  = loading === step.id;
              const isVerified = verified[step.id];
              const allDone    = step.items.every((i) =>
                step.mode === "honor" ? honorChecked[i.key] : followStatus[i.key] === true
              );
              const { Icon } = step;
              return (
                <div key={step.id} className={`ps-step${isActive?" active":""}${isComplete?" done":""}${isLocked2?" locked":""}`}>
                  <div className="ps-step-header">
                    <div className="ps-step-num" style={{ background:isComplete?"#22c55e":isActive?step.color:"rgba(0,0,0,0.06)", color:isComplete||isActive?"white":"#bbb" }}>
                      {isComplete ? <CheckIcon size={14} /> : idx + 1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"var(--font-display)",fontSize:"0.85rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:isComplete?"#15803d":"#111" }}>{step.label}</div>
                      <div style={{ fontSize:"11px",color:"#aaa",marginTop:"3px" }}>{step.sublabel}</div>
                    </div>
                    <div style={{ color:isComplete?"#22c55e":isLocked2?"#ccc":step.color }}><Icon size={22} /></div>
                  </div>

                  {isActive && (
                    <div className="ps-step-body">
                      <p style={{ fontSize:"13px",color:"#666",lineHeight:1.7,marginBottom:"18px",fontWeight:300,paddingTop:"4px",borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
                        {step.description}
                      </p>

                      {step.mode === "oauth-check" && !ytSubscribed && (
                        <div className="ps-yt-hint">
                          <strong style={{ fontWeight:600,color:"#555" }}>Step 1:</strong> Click <em>Subscribe on YouTube</em> below — it opens YouTube with the subscribe button ready. Come back here once subscribed.
                        </div>
                      )}
                      {step.mode === "oauth-check" && ytSubscribed && (
                        <div className="ps-yt-hint" style={{ background:"#f0fdf4",borderColor:"rgba(34,197,94,0.25)",color:"#15803d" }}>
                          <strong style={{ fontWeight:600 }}>Step 2:</strong> Good — now click <em>Verify Subscription via Google</em> to confirm you subscribed.
                        </div>
                      )}

                      {step.items.map((item) => {
                        const done = step.mode === "honor" ? !!honorChecked[item.key] : followStatus[item.key] === true;
                        return (
                          <div key={item.key} className={`ps-follow-item${done?" done":""}`}>
                            {step.mode === "honor" && (
                              <div className={`ps-honor${done?" on":""}`} onClick={() => setHonorChecked((p) => ({ ...p, [item.key]: !p[item.key] }))}>
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
                              <a href={FOLLOWS[item.key]?.url} target="_blank" rel="noreferrer" onClick={() => setYtSubscribed(true)}
                                style={{ fontSize:"11px",fontWeight:600,color:step.color,textDecoration:"none",padding:"6px 13px",borderRadius:"8px",background:step.colorDim,border:`0.5px solid ${step.color}33`,whiteSpace:"nowrap",flexShrink:0 }}>
                                Subscribe on YouTube →
                              </a>
                            )}
                          </div>
                        );
                      })}

                      {error && (
                        <div style={{ background:"#fef2f2",border:"0.5px solid #fecaca",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#dc2626",marginTop:"14px",lineHeight:1.6 }}>
                          {error}
                        </div>
                      )}

                      <div style={{ marginTop:"18px", display:"flex", flexDirection:"column", gap:"10px" }}>
                        {step.mode === "oauth-follow" && (
                          <button className="ps-btn" style={{ background:allDone&&isVerified?"#22c55e":step.color, color:"white" }} onClick={() => handleOAuth(step)} disabled={!!loading}>
                            {isLoading ? <><div className="ps-spinner"/>Following on Spotify…</>
                              : isVerified && allDone ? <><CheckIcon size={15}/>Followed — Continue</>
                              : isVerified ? <><Icon size={18}/>Retry Spotify</>
                              : <><Icon size={18}/>Connect Spotify &amp; Follow All</>}
                          </button>
                        )}
                        {step.mode === "oauth-check" && (
                          <button className="ps-btn" style={{ background:allDone?"#22c55e":step.color, color:"white" }} onClick={() => handleOAuth(step)} disabled={!!loading || !ytSubscribed} title={!ytSubscribed ? "Click 'Subscribe on YouTube' first" : ""}>
                            {isLoading ? <><div className="ps-spinner"/>Verifying with Google…</>
                              : allDone ? <><CheckIcon size={15}/>Verified — Continue</>
                              : <><Icon size={18}/>{ytSubscribed ? "Verify Subscription via Google" : "Subscribe on YouTube First ↑"}</>}
                          </button>
                        )}
                        {step.mode === "honor" && (
                          <div style={{ fontSize:"12px",color:allDone?"#16a34a":"#aaa",textAlign:"center",padding:"10px 0",fontWeight:allDone?600:300 }}>
                            {allDone ? "✓ Confirmed — advancing to next step…" : "Click 'Follow →' above, then check the box to confirm"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Optional follows */}
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
          </div>

          {/* Right panel */}
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
                      <div style={{ fontSize:"12px",color:"#aaa",fontWeight:300 }}>
                        {step.mode === "oauth-follow" && "Follows performed automatically via OAuth"}
                        {step.mode === "honor"        && "Self-confirmed — click link, check the box"}
                        {step.mode === "oauth-check"  && "Subscribe manually, then verify via Google OAuth"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:"24px",padding:"16px",background:"#f7f6f3",borderRadius:"12px",border:"0.5px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontFamily:"var(--font-display)",fontSize:"0.75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#111",marginBottom:"8px" }}>Review timeline</div>
                <p style={{ fontSize:"12px",color:"#888",fontWeight:300,lineHeight:1.65,margin:0 }}>Our team reviews within <strong style={{ fontWeight:600,color:"#555" }}>5–7 business days</strong>. You'll hear back via email regardless of outcome.</p>
              </div>
              <div style={{ marginTop:"16px",padding:"16px",background:"#f7f6f3",borderRadius:"12px",border:"0.5px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontFamily:"var(--font-display)",fontSize:"0.75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#111",marginBottom:"8px" }}>Privacy</div>
                <p style={{ fontSize:"12px",color:"#888",fontWeight:300,lineHeight:1.65,margin:0 }}>
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
        </div>

        <Footer />
      </div>
    </>
  );
}