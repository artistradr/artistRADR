import PropTypes from "prop-types";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import "./AuthLayout.css";

// Shared page shell for sign in and register. On desktop it is two columns: a brand panel on the
// left and the form on the right. On smaller screens only the form shows.
export default function AuthLayout({ navAction, tone = "orange", badge, title, subtitle, aside, children }) {
  return (
    <div className="auth-page">
      <Navbar routes={routes} action={navAction} />

      <div className="auth-split">
        <aside className="auth-aside" aria-label="About Artist RADR">
          <div className="auth-aside-kicker">{aside.kicker}</div>
          <h2 className="auth-aside-heading">{aside.heading}</h2>
          <p className="auth-aside-text">{aside.text}</p>
          <ul className="auth-aside-points">
            {aside.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </aside>

        <main className="auth-main">
          <div className="auth-form-wrap">
            <div className={`auth-badge${tone === "teal" ? " auth-badge--teal" : ""}`}>{badge}</div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-sub">{subtitle}</p>
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

AuthLayout.propTypes = {
  navAction: PropTypes.object.isRequired,
  tone: PropTypes.oneOf(["orange", "teal"]),
  badge: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node.isRequired,
  aside: PropTypes.shape({
    kicker: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    points: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};
