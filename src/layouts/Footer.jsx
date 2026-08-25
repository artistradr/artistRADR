import { Link } from "react-router-dom";

const quickLinks = [
  { name: "On Your RADR", route: "/blog" },
  { name: "Curated Playlist", route: "/curated-playlist" },
  { name: "Contact Us", route: "/contact-us" },
  { name: "Knowledge Center", route: "/pages/toolkit/knowledge-center" },
];

const legalLinks = [
  { name: "Privacy Policy", route: "/privacy-policy" },
  { name: "Terms & Conditions", route: "/terms-and-conditions" },
];

function Footer() {
  return (
    <>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 48px;
        }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .footer-legal {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 18px;
        }
        .footer-legal a {
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 150ms ease;
        }
        .footer-legal a:hover {
          color: rgba(255,255,255,0.6);
        }
        .footer-brand {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .footer-brand em {
          font-style: italic;
          color: #D94F2B;
        }
        .footer-brand .radr-text {
          text-transform: uppercase;
        }
        @media (max-width: 720px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>

      <footer style={{ background: "#111", color: "white", padding: "64px 0 32px", fontFamily: "var(--font-body)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem" }}>

          <div className="footer-grid">

            {/* Brand */}
            <div>
              <div className="footer-brand">
                <em>Artist</em> <span className="radr-text">RADR</span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontWeight: 300, maxWidth: "300px", marginBottom: "20px" }}>
                Let your voice echo with Artist RADR — a creative sanctuary where lyrics meet identity. More than music — it&apos;s your truth, amplified.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { href: "https://instagram.com/artistradr", label: "Instagram", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                  { href: "https://twitter.com/artistradr", label: "Twitter", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { href: "https://youtube.com/@artistradr", label: "YouTube", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> },
                ].map(({ href, label, icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "36px", height: "36px", borderRadius: "9px",
                    background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)", textDecoration: "none",
                  }}>{icon}</a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "18px" }}>Quick Links</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {quickLinks.map(({ name, route }) => (
                  <li key={name} style={{ marginBottom: "12px" }}>
                    <Link to={route} style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontFamily: "var(--font-body)" }}>{name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Toolkit */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "18px" }}>Toolkit</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  { name: "Freebies", to: "/pages/toolkit/freebies", internal: true },
                  { name: "Premium Tools", to: "/pages/toolkit/premium-tools", internal: true },
                  { name: "Knowledge Center", to: "/pages/toolkit/knowledge-center", internal: true },
                  { name: "Playlist Submission", to: "/submit-track", internal: true },
                ].map(({ name, to, internal }) => (
                  <li key={name} style={{ marginBottom: "12px" }}>
                    {internal
                      ? <Link to={to} style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontFamily: "var(--font-body)" }}>{name}</Link>
                      : <a href={to} target="_blank" rel="noreferrer" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontFamily: "var(--font-body)" }}>{name}</a>
                    }
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", margin: "48px 0 24px" }} />

          {/* Bottom */}
          <div className="footer-bottom" style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.3)" }}>
            <span>&copy; {new Date().getFullYear()} Artist RADR. All rights reserved.</span>
            <div className="footer-legal">
              {legalLinks.map(({ name, route }) => (
                <Link key={name} to={route}>{name}</Link>
              ))}
              <span>Made for artists, by music lovers.</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;