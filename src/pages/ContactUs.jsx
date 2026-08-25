import { useState, useRef, useEffect } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// ── Minimal animated counter ──────────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const steps = 50;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((o) => !o)}
      style={{
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 180ms",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: "20px",
        padding: "24px 0",
      }}>
        <span style={{
          fontFamily: F.d, fontSize: "0.7rem", fontWeight: 800,
          letterSpacing: "1px", color: open ? "#D94F2B" : "#ccc",
          flexShrink: 0, transition: "color 200ms", minWidth: "28px",
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{
          fontFamily: F.d, fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
          color: open ? "#111" : "#333", flex: 1, transition: "color 200ms",
        }}>
          {q}
        </span>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: open ? "#D94F2B" : "rgba(0,0,0,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 200ms, transform 200ms",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={open ? "white" : "#999"} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </div>
      <div style={{
        overflow: "hidden", maxHeight: open ? "200px" : "0",
        transition: "max-height 320ms cubic-bezier(.4,0,.2,1)",
      }}>
        <p style={{
          fontFamily: F.b, fontSize: "14px", color: "#777",
          lineHeight: 1.75, fontWeight: 300,
          padding: "0 0 24px 48px", margin: 0,
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}

export default function ContactUs() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(null);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    // Replace with your real form submission (e.g. Firebase, EmailJS, Resend)
    await new Promise((r) => setTimeout(r, 1400));
    setSent(true);
    setSending(false);
  };

  const fieldStyle = (name) => ({
    width: "100%", boxSizing: "border-box",
    padding: "14px 18px",
    border: `1px solid ${focused === name ? "#D94F2B" : "rgba(0,0,0,0.1)"}`,
    borderRadius: "12px",
    fontSize: "14px", fontFamily: F.b, color: "#111",
    background: focused === name ? "#fff" : "#fafaf9",
    outline: "none",
    transition: "border-color 160ms, background 160ms, box-shadow 160ms",
    boxShadow: focused === name ? "0 0 0 3px rgba(217,79,43,0.1)" : "none",
  });

  const fp = (name) => ({ onFocus: () => setFocused(name), onBlur: () => setFocused(null) });

  const stats = [
    { num: 10000, suffix: "+", label: "Artists discovered" },
    { num: 50000, suffix: "+", label: "Monthly listeners" },
    { num: 200,   suffix: "+", label: "Curated playlists" },
    { num: 2,     suffix: " day", label: "Avg. response time" },
  ];

  const faqs = [
    { q: "How do I submit my track?",         a: "Click 'Submit Track' in the navbar and fill out our submission form. We listen to every submission and reply within 5–7 business days with feedback." },
    { q: "Is Artist RADR free to use?",       a: "Yes — discovering artists and browsing all content on Artist RADR is completely free. Some premium toolkit features require a subscription." },
    { q: "Can I collaborate or partner?",     a: "We're open to brand partnerships, playlist placements, and editorial collaborations. Reach out via the form and mention 'Partnership' in the subject." },
    { q: "How long does a response take?",    a: "We aim to reply to all enquiries within 1–2 business days. Track submissions may take slightly longer as we listen carefully to each one." },
    { q: "Do you accept all genres?",         a: "Yes — RADR is genre-agnostic. From Afrobeats and R&B to indie and electronic, all sounds are welcome as long as the quality is there." },
    { q: "Can I update my submission?",       a: "Once submitted, you can't edit the form but you can submit again or email us directly referencing your original submission." },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealLine {
          from { scaleX: 0; }
          to   { scaleX: 1; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }

        .cu-page { animation: fadeUp 500ms ease both; font-family: var(--font-body); }

        /* hero noise texture overlay */
        .cu-hero {
          position: relative;
          padding: 160px 2rem 0;
          overflow: hidden;
          background: #f7f6f3;
        }
        .cu-hero::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 180px;
          pointer-events: none; z-index: 0;
        }

        /* floating decorative circles */
        .cu-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }

        .cu-hero-inner {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 420px;
          gap: 60px; align-items: end;
          padding-bottom: 0;
        }

        /* stat strip */
        .cu-stats {
          background: #111; color: white;
          position: relative; overflow: hidden;
        }
        .cu-stats-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4,1fr);
        }
        .cu-stat {
          padding: 32px 24px; text-align: center;
          border-right: 0.5px solid rgba(255,255,255,0.07);
          transition: background 200ms;
        }
        .cu-stat:last-child { border-right: none; }
        .cu-stat:hover { background: rgba(217,79,43,0.1); }

        /* body grid */
        .cu-body {
          max-width: 1100px; margin: 0 auto;
          padding: 72px 2rem 100px;
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 52px; align-items: start;
        }

        /* info card */
        .cu-info {
          position: sticky; top: 100px;
          background: #111; border-radius: 24px;
          padding: 44px 40px; color: white;
          overflow: hidden;
        }
        .cu-info-accent {
          position: absolute; bottom: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(217,79,43,0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .cu-info-accent2 {
          position: absolute; top: -40px; left: -40px;
          width: 160px; height: 160px; border-radius: 50%;
          background: radial-gradient(circle, rgba(77,217,208,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .cu-contact-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          transition: background 150ms;
        }
        .cu-contact-row:last-child { border-bottom: none; }

        .cu-social-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 100px;
          background: rgba(255,255,255,0.06);
          border: 0.5px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          font-size: 12px; font-weight: 500;
          text-decoration: none;
          transition: background 160ms, color 160ms, border-color 160ms;
        }
        .cu-social-btn:hover {
          background: rgba(217,79,43,0.2);
          border-color: rgba(217,79,43,0.4);
          color: white;
        }

        /* form card */
        .cu-form-card {
          background: white; border-radius: 24px;
          padding: 50px 48px;
          border: 0.5px solid rgba(0,0,0,0.07);
          box-shadow: 0 4px 40px rgba(0,0,0,0.04);
        }

        .cu-label {
          display: block;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #999; margin-bottom: 8px;
        }

        .cu-submit-btn {
          width: 100%; padding: 16px;
          background: #111; color: white;
          border: none; border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.3px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 160ms, transform 120ms, box-shadow 160ms;
          position: relative; overflow: hidden;
        }
        .cu-submit-btn::before {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(217,79,43,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 200ms;
        }
        .cu-submit-btn:hover:not(:disabled)::before { opacity: 1; }
        .cu-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
        .cu-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* success */
        .cu-success {
          text-align: center; padding: 60px 20px;
          animation: fadeUp 400ms ease both;
        }

        /* FAQ section */
        .cu-faq {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem 100px;
          display: grid; grid-template-columns: 320px 1fr;
          gap: 80px; align-items: start;
        }
        .cu-faq-sticky {
          position: sticky; top: 100px;
        }

        /* responsive */
        @media (max-width: 960px) {
          .cu-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .cu-hero-preview { display: none !important; }
          .cu-stats-inner { grid-template-columns: repeat(2,1fr); }
          .cu-stat { border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
          .cu-stat:nth-child(2n) { border-bottom: 0.5px solid rgba(255,255,255,0.07); }
          .cu-stat:nth-child(3), .cu-stat:nth-child(4) { border-bottom: none; }
          .cu-body { grid-template-columns: 1fr; }
          .cu-info { position: static; }
          .cu-form-card { padding: 36px 28px; }
          .cu-faq { grid-template-columns: 1fr; gap: 40px; }
          .cu-faq-sticky { position: static; }
        }
        @media (max-width: 600px) {
          .cu-hero { padding: 130px 1.5rem 0; }
          .cu-body { padding: 48px 1.5rem 80px; }
          .cu-info { padding: 32px 24px; }
          .cu-form-card { padding: 28px 20px; }
          .cu-form-row { grid-template-columns: 1fr !important; }
          .cu-faq { padding: 0 1.5rem 80px; }
        }
      `}</style>

      <div className="cu-page" style={{ background: "#f7f6f3", minHeight: "100vh", color: "#111" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        {/* ══ HERO ══ */}
        <section className="cu-hero">
          {/* decorative orbs */}
          <div className="cu-orb" style={{ width: "500px", height: "500px", top: "-200px", right: "-100px", background: "radial-gradient(circle, rgba(217,79,43,0.07) 0%, transparent 65%)" }} />
          <div className="cu-orb" style={{ width: "300px", height: "300px", bottom: "0", left: "-60px", background: "radial-gradient(circle, rgba(77,217,208,0.08) 0%, transparent 65%)" }} />

          <div className="cu-hero-inner" style={{ padding: "0 0 72px" }}>
            {/* Left — headline */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "8px" }}>
                Artist RADR · Contact
              </div>

              <h1 style={{ fontFamily: F.d, fontSize: "clamp(3rem, 6vw, 5.5rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 0.95, color: "#111", margin: "0 0 28px" }}>
                Let&apos;s Talk<br />
                <span style={{ fontStyle: "italic", color: "#D94F2B", WebkitTextStroke: "0px" }}>Music.</span>
              </h1>

              <p style={{ fontSize: "15px", color: "#777", fontWeight: 300, lineHeight: 1.8, maxWidth: "420px", margin: "0 0 40px" }}>
                Whether you&apos;re an artist looking to get discovered, a curator wanting to collaborate, or just a fan with something to say — we&apos;re all ears.
              </p>

              {/* Quick contact chips */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a href="mailto:hello@artistradr.com" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", background: "#111", color: "white", fontSize: "12px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px", transition: "background 160ms" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  hello@artistradr.com
                </a>
                <a href="https://instagram.com/artistradr" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", background: "white", color: "#111", fontSize: "12px", fontWeight: 600, textDecoration: "none", border: "0.5px solid rgba(0,0,0,0.1)", letterSpacing: "0.3px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  @artistradr
                </a>
              </div>
            </div>

            {/* Right — decorative card stack */}
            <div className="cu-hero-preview" style={{ position: "relative", height: "340px" }}>
              {/* Back card */}
              <div style={{ position: "absolute", top: "20px", right: "20px", width: "300px", borderRadius: "20px", background: "white", border: "0.5px solid rgba(0,0,0,0.07)", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", transform: "rotate(4deg)", opacity: 0.6 }}>
                <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "#eeecea", marginBottom: "10px" }} />
                <div style={{ width: "70%", height: "8px", borderRadius: "4px", background: "#eeecea", marginBottom: "20px" }} />
                <div style={{ width: "100%", height: "80px", borderRadius: "10px", background: "#f7f6f3" }} />
              </div>
              {/* Front card */}
              <div style={{ position: "absolute", top: "0", left: "0", width: "300px", borderRadius: "20px", background: "#111", padding: "28px 28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", transform: "rotate(-2deg)", animation: "float 5s ease-in-out infinite" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#D94F2B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "white", letterSpacing: "0.5px" }}>Message received</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>Just now</div>
                  </div>
                </div>
                <div style={{ fontFamily: F.d, fontSize: "1rem", fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>We&apos;ll be in touch.</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: "0 0 20px", fontWeight: 300 }}>Our team reviews all messages within 1–2 business days.</p>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["Reply", "Archive"].map((label, i) => (
                    <div key={label} style={{ padding: "6px 14px", borderRadius: "100px", background: i === 0 ? "#D94F2B" : "rgba(255,255,255,0.07)", fontSize: "10px", fontWeight: 600, color: "white", letterSpacing: "0.5px" }}>{label}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* divider line */}
          <div style={{ maxWidth: "1100px", margin: "0 auto", height: "0.5px", background: "rgba(0,0,0,0.08)" }} />
        </section>

        {/* ══ STATS ══ */}
        <section className="cu-stats">
          <div className="cu-stats-inner">
            {stats.map(({ num, suffix, label }) => (
              <div key={label} className="cu-stat">
                <div style={{ fontFamily: F.d, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "1px", lineHeight: 1, color: "#D94F2B", marginBottom: "6px" }}>
                  <Counter target={num} suffix={suffix} />
                </div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ BODY: info + form ══ */}
        <section className="cu-body" style={{ padding: "72px 2rem 100px" }}>

          {/* ── Info card ── */}
          <div className="cu-info" style={{ position: "sticky", top: "100px" }}>
            <div className="cu-info-accent" />
            <div className="cu-info-accent2" />
            <div style={{ position: "relative", zIndex: 1 }}>

              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "20px" }}>Contact info</div>

              <h2 style={{ fontFamily: F.d, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1.15, color: "white", margin: "0 0 10px" }}>
                We&apos;d Love To<br />Hear From You.
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, margin: "0 0 32px", fontWeight: 300 }}>
                Drop us a message and we&apos;ll get back to you within 1–2 business days.
              </p>

              {/* Contact rows */}
              {[
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
                  label: "Email us",
                  value: "hello@artistradr.com",
                  href: "mailto:hello@artistradr.com",
                },
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                  label: "Website",
                  value: "artistradr.com",
                  href: "https://artistradr.com",
                },
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                  label: "Response time",
                  value: "1–2 business days",
                  href: null,
                },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="cu-contact-row">
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "2px", fontWeight: 600 }}>{label}</div>
                    {href
                      ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500 }}>{value}</a>
                      : <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{value}</div>
                    }
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "28px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "14px" }}>Follow us</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { href: "https://instagram.com/artistradr",  label: "Instagram", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                    { href: "https://twitter.com/artistradr",    label: "X / Twitter", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                    { href: "https://youtube.com/@ArtistRADR",   label: "YouTube", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
                  ].map(({ href, label, icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" className="cu-social-btn">{icon}{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Form card ── */}
          <div className="cu-form-card">
            {sent ? (
              <div className="cu-success">
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #D94F2B, #e8633c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 30px rgba(217,79,43,0.3)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontFamily: F.d, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#111", marginBottom: "12px" }}>Message Sent!</div>
                <p style={{ fontSize: "15px", color: "#888", fontWeight: 300, lineHeight: 1.7, maxWidth: "340px", margin: "0 auto 32px" }}>
                  We&apos;ll be in touch within 1–2 business days. Thanks for reaching out.
                </p>
                <button onClick={() => { setSent(false); setForm({ name:"", email:"", subject:"", message:"" }); }}
                  style={{ padding: "12px 28px", borderRadius: "100px", border: "0.5px solid rgba(0,0,0,0.12)", background: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#555" }}>
                  Send another →
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "36px" }}>
                  <div style={{ fontFamily: F.d, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#111", marginBottom: "8px" }}>Send a Message</div>
                  <p style={{ fontSize: "13px", color: "#aaa", fontWeight: 300, margin: 0, lineHeight: 1.65 }}>All fields marked with * are required. We read every message personally.</p>
                </div>

                <form onSubmit={submit}>
                  {/* Row 1: name + email */}
                  <div className="cu-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    {[
                      { name: "name",  label: "Full name *",    placeholder: "Jordan Cole",         type: "text" },
                      { name: "email", label: "Email address *", placeholder: "you@example.com",    type: "email" },
                    ].map((f) => (
                      <div key={f.name}>
                        <label className="cu-label">{f.label}</label>
                        <input type={f.type} name={f.name} placeholder={f.placeholder}
                          value={form[f.name]} onChange={handle} required
                          style={fieldStyle(f.name)} {...fp(f.name)} />
                      </div>
                    ))}
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: "20px" }}>
                    <label className="cu-label">Subject *</label>
                    <input name="subject" placeholder="What's this about?" value={form.subject} onChange={handle} required style={fieldStyle("subject")} {...fp("subject")} />
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: "28px" }}>
                    <label className="cu-label">Message *</label>
                    <textarea name="message" placeholder="Tell us what's on your mind…" value={form.message} onChange={handle} required rows={6}
                      style={{ ...fieldStyle("message"), resize: "vertical", minHeight: "140px" }} {...fp("message")} />
                  </div>

                  {/* Submit */}
                  <button type="submit" className="cu-submit-btn" disabled={sending}>
                    {sending ? (
                      <>
                        <svg style={{ animation: "spin 700ms linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", marginTop: "16px", fontWeight: 300 }}>
                    We never share your information. By sending, you agree to our privacy policy.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section style={{ background: "white", borderTop: "0.5px solid rgba(0,0,0,0.06)", borderBottom: "0.5px solid rgba(0,0,0,0.06)", marginBottom: "0" }}>
          <div className="cu-faq">
            {/* Left sticky label */}
            <div className="cu-faq-sticky">
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#D94F2B", marginBottom: "16px" }}>FAQ</div>
              <h2 style={{ fontFamily: F.d, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1.05, color: "#111", margin: "0 0 16px" }}>
                Common<br />Questions.
              </h2>
              <p style={{ fontSize: "13px", color: "#aaa", fontWeight: 300, lineHeight: 1.7, margin: "0 0 28px" }}>
                Can't find what you're looking for? Just send us a message above.
              </p>
              <a href="mailto:hello@artistradr.com" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", background: "#111", color: "white", fontSize: "12px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
                Email us directly →
              </a>
            </div>

            {/* Right accordion */}
            <div style={{ padding: "60px 0" }}>
              {faqs.map((f, i) => <FAQItem key={f.q} {...f} index={i} />)}
            </div>
          </div>
        </section>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Footer />
      </div>
    </>
  );
}