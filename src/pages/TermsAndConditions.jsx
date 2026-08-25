import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const LAST_UPDATED = "20 August 2026";

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    color: "#D94F2B",
    body: [
      "By creating an account, submitting a track, or otherwise using Artist RADR (\"RADR\", \"we\", \"us\"), you agree to these Terms & Conditions. If you don't agree, please don't use the platform.",
      "We may update these terms as RADR evolves. Continued use after a change means you accept the updated terms — the \"last updated\" date above always reflects the current version.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility & accounts",
    color: "#4DD9D0",
    body: [
      "You must provide accurate information when registering, and keep your account credentials secure — you're responsible for activity that happens under your account.",
      "You must own or control the rights to any track you submit for playlist consideration.",
      "We may suspend or terminate accounts that violate these terms, misuse the platform, or attempt to abuse the submission process.",
    ],
  },
  {
    id: "submissions",
    title: "Track submissions & review",
    color: "#D94F2B",
    body: [
      "Submitting a track does not guarantee placement on any RADR playlist. Our A&R team reviews every submission personally and responds within 5–7 business days, but selection is at our discretion.",
      "By submitting a track, you confirm you have the necessary rights to the music and that it doesn't infringe on anyone else's rights.",
      "We don't take ownership of your music by reviewing or featuring it — you retain all rights to your work.",
    ],
  },
  {
    id: "oauth-connections",
    title: "Spotify & YouTube connections",
    color: "#4DD9D0",
    body: [
      "Connecting your Spotify account authorizes RADR to follow the RADR profile and specified playlists on your behalf, one time, as part of completing a submission step. We don't take any other action on your Spotify account.",
      "Connecting your Google account for YouTube verification only reads your subscription status to confirm you've subscribed — we never post, comment, or modify anything on your YouTube or Google account.",
      "You can revoke either connection at any time from your Spotify or Google account settings.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    color: "#D94F2B",
    body: [
      "Don't use RADR to submit content you don't have rights to, spam the submission process, attempt to manipulate follow/subscription verification, or interfere with the platform's normal operation.",
      "Don't attempt to gain unauthorized access to other users' accounts or to RADR's backend systems.",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers & limitation of liability",
    color: "#4DD9D0",
    body: [
      "RADR is provided \"as is,\" without warranties of any kind. We don't guarantee uninterrupted availability, that submissions will be reviewed within a specific timeframe, or any particular outcome from playlist consideration.",
      "To the fullest extent permitted by law, RADR isn't liable for indirect, incidental, or consequential damages arising from your use of the platform.",
    ],
  },
  {
    id: "contact",
    title: "Governing terms & contact",
    color: "#D94F2B",
    body: [
      "These terms, together with our Privacy Policy, form the whole agreement between you and RADR regarding use of the platform.",
      "Questions about these terms? Reach out — see Contact below.",
    ],
  },
];

export default function TermsAndConditions() {
  return (
    <>
      <style>{`
        .tc-section {
          background: white; border-radius: 18px; border: 0.5px solid rgba(0,0,0,0.08);
          padding: 30px 32px; margin-bottom: 18px;
        }
        .tc-bullet {
          display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px;
        }
        .tc-bullet:last-child { margin-bottom: 0; }
        .tc-toc a { text-decoration: none; color: #888; font-size: 13px; transition: color 150ms ease; }
        .tc-toc a:hover { color: #111; }
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
              Terms &amp; Conditions
            </h1>
            <p style={{ fontSize: "14px", color: "#aaa", fontWeight: 300, margin: 0 }}>
              Last updated {LAST_UPDATED}
            </p>
            <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "560px", margin: "18px 0 0" }}>
              The rules of the road for using Artist RADR — submissions, connected accounts, and what you can expect from us.
            </p>
          </div>

          {/* ── Table of contents ── */}
          <div className="tc-toc" style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginBottom: "44px" }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}>{s.title}</a>
            ))}
          </div>

          {/* ── Sections ── */}
          <div style={{ maxWidth: "760px", marginBottom: "60px" }}>
            {SECTIONS.map(({ id, title, color, body }) => (
              <div key={id} id={id} className="tc-section">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111" }}>
                    {title}
                  </div>
                </div>
                {body.map((line, i) => (
                  <div key={i} className="tc-bullet">
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
                Questions about these terms?
              </div>
              <div style={{ fontFamily: F.d, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "white", lineHeight: 1.2, marginBottom: "14px" }}>
                Reach out any time
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.75, margin: "0 0 20px" }}>
                If anything here is unclear, or you have questions about how these terms apply to you, contact us and we'll get back to you.
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