import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const LAST_UPDATED = "20 August 2026";

const SECTIONS = [
  {
    id: "info-we-collect",
    title: "Information we collect",
    color: "#D94F2B",
    body: [
      "Account information you give us directly — name, email address, and artist name — when you register, sign in, or submit a track through the Playlist Submission form.",
      "Track submission details — artist name, track name, genre, Spotify link, and any notes you include when you submit music for playlist consideration.",
      "OAuth data from Spotify and Google/YouTube — when you connect these accounts to follow RADR's Spotify profile and playlists, or to verify your YouTube subscription, we receive a short-lived authorization code and, in Spotify's case, perform the follow action on your behalf. We never see or store your Spotify or Google password.",
      "Basic usage information — such as pages visited and general device/browser information, collected automatically to keep the site working properly and secure.",
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    color: "#4DD9D0",
    body: [
      "To operate the playlist submission process — reviewing your track, verifying your Spotify follows and YouTube subscription, and contacting you about the outcome.",
      "To maintain your account, including sign-in and role-based access (for example, staff dashboard access for the RADR team).",
      "To send you updates you've asked for, like notifying you when new Freebies resources drop.",
      "To keep the platform secure and working reliably, including diagnosing errors and preventing abuse.",
    ],
  },
  {
    id: "what-we-dont-do",
    title: "What we don't do",
    color: "#D94F2B",
    body: [
      "We don't store your Spotify or Google account password — authentication happens directly with Spotify/Google via OAuth, and we only ever receive a temporary authorization code.",
      "We don't post, message, or take any action on your Spotify or YouTube account beyond what you explicitly authorize (following the RADR profile and playlists on Spotify, or reading — never writing — your YouTube subscription status).",
      "We don't sell your personal information to third parties.",
    ],
  },
  {
    id: "sharing",
    title: "Who we share information with",
    color: "#4DD9D0",
    body: [
      "Service providers that power the platform — currently Supabase (database, authentication, and backend functions) — who process data on our behalf under their own security and privacy commitments.",
      "Spotify and Google/YouTube — only the minimum data required to complete the OAuth flow you initiate (an authorization code exchanged for an access token used once to perform the follow or subscription check).",
      "We do not share your information with advertisers or data brokers.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices and rights",
    color: "#D94F2B",
    body: [
      "You can review or update your account details from your Profile page at any time.",
      "You can disconnect Spotify or Google access for RADR at any time from your Spotify or Google account settings — this revokes RADR's ability to read or act on that account going forward.",
      "You can ask us to delete your account and associated data by contacting us — see Contact below.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    color: "#4DD9D0",
    body: [
      "We keep account and submission information for as long as your account is active or as needed to provide the service, and for a reasonable period afterward for legal, security, and record-keeping purposes.",
      "OAuth authorization codes are used once, immediately, to complete a follow or verification action and are not stored afterward.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    color: "#D94F2B",
    body: [
      "We may update this policy from time to time as the platform evolves. The \"last updated\" date at the top of this page reflects the most recent revision. Material changes will be reflected here.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <style>{`
        .pp-section {
          background: white; border-radius: 18px; border: 0.5px solid rgba(0,0,0,0.08);
          padding: 30px 32px; margin-bottom: 18px;
        }
        .pp-bullet {
          display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px;
        }
        .pp-bullet:last-child { margin-bottom: 0; }
        .pp-toc a { text-decoration: none; color: #888; font-size: 13px; transition: color 150ms ease; }
        .pp-toc a:hover { color: #111; }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        {/* ── Hero ── */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%", padding: "120px 1.5rem 0" }}>
          <div style={{ borderBottom: "0.5px solid rgba(0,0,0,0.09)", paddingBottom: "40px", marginBottom: "44px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
              Legal
            </div>
            <h1 style={{ fontFamily: F.d, fontSize: "clamp(2.8rem, 6vw, 4.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1, color: "#111", margin: "0 0 14px" }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: "14px", color: "#aaa", fontWeight: 300, margin: 0 }}>
              Last updated {LAST_UPDATED}
            </p>
            <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "560px", margin: "18px 0 0" }}>
              This page explains what information Artist RADR collects, how we use it, and the choices you have — in plain terms, no legal jargon we can avoid.
            </p>
          </div>

          {/* ── Table of contents ── */}
          <div className="pp-toc" style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginBottom: "44px" }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}>{s.title}</a>
            ))}
          </div>

          {/* ── Sections ── */}
          <div style={{ maxWidth: "760px", marginBottom: "60px" }}>
            {SECTIONS.map(({ id, title, color, body }) => (
              <div key={id} id={id} className="pp-section">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111" }}>
                    {title}
                  </div>
                </div>
                {body.map((line, i) => (
                  <div key={i} className="pp-bullet">
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "8px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#666", fontWeight: 300, lineHeight: 1.75, margin: 0 }}>{line}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Contact CTA ── */}
          <div style={{ background: "#111", borderRadius: "20px", padding: "44px", marginBottom: "80px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,79,43,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1, maxWidth: "520px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "10px" }}>
                Questions about your data?
              </div>
              <div style={{ fontFamily: F.d, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.2, marginBottom: "14px" }}>
                Reach out any time
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.75, margin: "0 0 20px" }}>
                If you'd like to review, correct, or delete your data, or have any questions about this policy, contact us and we'll get back to you.
              </p>
              <a href="/contact-us" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#D94F2B", color: "white", padding: "13px 24px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(217,79,43,0.4)" }}>
                Contact Us →
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}