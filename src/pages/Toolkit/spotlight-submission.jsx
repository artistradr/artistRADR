import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { useAuthGate } from "context/AuthGateContext";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const EMPTY = {
  artistName: "", email: "", featuredTrackUrl: "", bio: "",
  instagramUrl: "", photoUrl: "", otherLinks: "", notes: "",
};

const STATUS = {
  open: ["In review", "#b45309"],
  approved: ["Approved", "#15803d"],
  rejected: ["Not selected", "#b91c1c"],
  resolved: ["Closed", "#555"],
};

const isHttps = (v) => !v || v.startsWith("https://");

function validate(f) {
  if (!f.artistName.trim()) return "Please add your artist name.";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return "Please add a valid email address.";
  if (!f.featuredTrackUrl.trim().startsWith("https://open.spotify.com/")) {
    return "Your track link should start with https://open.spotify.com/";
  }
  if (!f.bio.trim()) return "Please tell us a little about yourself.";
  if (f.bio.length > 1500) return "Your bio is over 1,500 characters. Please shorten it.";
  if (!isHttps(f.instagramUrl.trim()) || !isHttps(f.photoUrl.trim())) {
    return "Instagram and photo links should start with https://";
  }
  return null;
}

function Field({ label, hint, children }) {
  return (
    <label className="sp-field">
      <span className="sp-label">{label}</span>
      {children}
      {hint && <span className="sp-hint">{hint}</span>}
    </label>
  );
}

export default function SpotlightSubmissionPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { requireAuth } = useAuthGate();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [mine, setMine] = useState([]);

  const isGuest = !authLoading && !user;
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (user?.email) setForm((p) => (p.email ? p : { ...p, email: user.email }));
  }, [user]);

  const loadMine = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("spotlight_submissions")
      .select("id, artist_name, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5);
    setMine(data || []);
  };

  useEffect(() => { loadMine(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAuth = (mode) =>
    requireAuth(null, {
      title: "Spotlight Consideration",
      description: "Create a free RADR account or sign in to be considered for the RADR Spotlight.",
      benefits: [
        "Be considered for the RADR Spotlight playlist and feature",
        "Track the status of your submission",
        "Free — no credit card needed",
      ],
      defaultMode: mode,
    });

  const handleSubmit = async () => {
    const problem = validate(form);
    if (problem) { setError(problem); return; }
    setError(null);
    setSubmitting(true);
    const clean = (v) => (v.trim() ? v.trim() : null);
    const { error: err } = await supabase.from("spotlight_submissions").insert({
      user_id: user.id,
      artist_name: form.artistName.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
      featured_track_url: form.featuredTrackUrl.trim(),
      instagram_url: clean(form.instagramUrl),
      photo_url: clean(form.photoUrl),
      other_links: clean(form.otherLinks),
      notes: clean(form.notes),
    });
    setSubmitting(false);
    if (err) {
      console.error(err);
      setError("We couldn't send your submission. Please check the fields and try again.");
      return;
    }
    setSubmitted(true);
    loadMine();
  };

  const startAnother = () => { setForm({ ...EMPTY, email: user?.email || "" }); setSubmitted(false); };

  return (
    <>
      <style>{`
        .sp-page { font-family:var(--font-body); background:#f7f6f3; min-height:100vh; display:flex; flex-direction:column; }
        .sp-wrap { max-width:1180px; margin:0 auto; padding:0 1.5rem; width:100%; box-sizing:border-box; }
        .sp-body { display:grid; grid-template-columns:1fr 340px; gap:48px; align-items:start; padding-bottom:100px; }
        .sp-card { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:20px; padding:32px; }
        .sp-field { display:block; margin-bottom:14px; }
        .sp-label { display:block; font-size:11px; font-weight:600; letter-spacing:0.8px; text-transform:uppercase; color:#555; margin-bottom:6px; }
        .sp-hint { display:block; font-size:11px; color:#aaa; margin-top:5px; }
        .sp-input { width:100%; padding:11px 14px; border-radius:10px; border:0.5px solid rgba(0,0,0,0.14); background:#f7f6f3; font-family:var(--font-body); font-size:13px; color:#111; outline:none; box-sizing:border-box; }
        .sp-input:focus { border-color:#111; background:white; }
        .sp-btn { width:100%; padding:14px; border-radius:12px; border:none; background:#111; color:white; font-family:var(--font-body); font-size:13px; font-weight:700; letter-spacing:0.4px; cursor:pointer; transition:opacity 150ms; }
        .sp-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .sp-btn.ghost { background:transparent; color:#555; border:0.5px solid rgba(0,0,0,0.12); }
        .sp-side-title { font-family:var(--font-display); font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#111; margin-bottom:8px; }
        .sp-side-text { font-size:13px; color:#888; font-weight:300; line-height:1.65; margin:0; }
        @media (max-width:900px) { .sp-body { grid-template-columns:1fr; gap:28px; } .sp-card { padding:24px 20px; } }
      `}</style>

      <div className="sp-page">
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-spotlight", label: "Get Featured" }} />

        <div className="sp-wrap" style={{ paddingTop: "110px" }}>
          <div style={{ borderBottom: "0.5px solid rgba(0,0,0,0.1)", paddingBottom: "28px", marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
              Artist RADR · Spotlight
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem,6vw,4.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: "0 0 14px" }}>
              Submit For<br />Spotlight Consideration
            </h1>
            <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, lineHeight: 1.7, margin: 0, maxWidth: "560px" }}>
              Tell us about you and your best track. Our team reviews every Spotlight submission personally.
            </p>
          </div>
        </div>

        <div className="sp-wrap sp-body">
          <div className="sp-card">
            {isGuest ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "10px" }}>Members only</div>
                <p style={{ fontSize: "14px", color: "#777", fontWeight: 300, lineHeight: 1.7, maxWidth: "360px", margin: "0 auto 24px" }}>
                  Create a free RADR account or sign in to submit for Spotlight consideration.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px", margin: "0 auto" }}>
                  <button className="sp-btn" onClick={() => openAuth("register")}>Create Free Account</button>
                  <button className="sp-btn ghost" onClick={() => openAuth("signin")}>Sign In</button>
                </div>
              </div>
            ) : submitted ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "10px" }}>Submission received</div>
                <p style={{ fontSize: "14px", color: "#777", fontWeight: 300, lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 24px" }}>
                  Thanks. Our team will review your Spotlight submission and get back to you by email.
                </p>
                <button className="sp-btn ghost" style={{ maxWidth: "260px" }} onClick={startAnother}>Submit another artist</button>
              </div>
            ) : (
              <>
                <Field label="Artist name *">
                  <input className="sp-input" value={form.artistName} onChange={set("artistName")} maxLength={120} placeholder="Your artist name" />
                </Field>
                <Field label="Email *">
                  <input className="sp-input" type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" />
                </Field>
                <Field label="Spotify track link *" hint="The track you want us to feature.">
                  <input className="sp-input" type="url" value={form.featuredTrackUrl} onChange={set("featuredTrackUrl")} placeholder="https://open.spotify.com/track/..." />
                </Field>
                <Field label="About you *" hint={`${form.bio.length}/1500`}>
                  <textarea className="sp-input" rows={5} value={form.bio} onChange={set("bio")} maxLength={1500} placeholder="Who you are, your sound, and what you're working on…" style={{ resize: "vertical" }} />
                </Field>
                <Field label="Instagram link (optional)">
                  <input className="sp-input" type="url" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/yourname" />
                </Field>
                <Field label="Press photo link (optional)" hint="A link to a photo we can use, for example Google Drive or Dropbox.">
                  <input className="sp-input" type="url" value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://…" />
                </Field>
                <Field label="Other links (optional)">
                  <textarea className="sp-input" rows={2} value={form.otherLinks} onChange={set("otherLinks")} maxLength={1000} placeholder="YouTube, press, interviews…" style={{ resize: "vertical" }} />
                </Field>
                <Field label="Anything else? (optional)">
                  <textarea className="sp-input" rows={2} value={form.notes} onChange={set("notes")} maxLength={1000} style={{ resize: "vertical" }} />
                </Field>
                {error && (
                  <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#dc2626", margin: "4px 0 14px", lineHeight: 1.6 }}>{error}</div>
                )}
                <button className="sp-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit For Spotlight →"}
                </button>
              </>
            )}
          </div>

          <div>
            <div className="sp-card" style={{ padding: "24px", marginBottom: "16px" }}>
              <div className="sp-side-title">What happens next</div>
              <p className="sp-side-text">Our team reviews each submission and replies by email. Being considered is not a guarantee of a feature.</p>
            </div>
            {user && mine.length > 0 && (
              <div className="sp-card" style={{ padding: "24px" }}>
                <div className="sp-side-title">Your submissions</div>
                {mine.map((s) => {
                  const [label, color] = STATUS[s.status] || [s.status, "#555"];
                  return (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 0", borderTop: "0.5px solid rgba(0,0,0,0.06)", fontSize: "13px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#111", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.artist_name}</div>
                        <div style={{ color: "#aaa", fontSize: "11px" }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ color, fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
