import PropTypes from "prop-types";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import "./AuthLayout.css";

// Shared page shell for sign in and register. One continuous background, no card.
// On desktop the form is on the left and the brand copy on the right. On smaller screens only the form shows.
export default function AuthLayout({ navAction, aside, footer, children }) {
  return (
    <div className="auth-page">
      <Navbar routes={routes} action={navAction} />

      <div className="auth-split">
        <main className="auth-main">
          <div className="auth-modal">{children}</div>
          {footer && <p className="auth-modal-foot">{footer}</p>}
        </main>

        <aside className="auth-aside" aria-label="About Artist RADR">
          <div className="auth-aside-kicker">{aside.kicker}</div>
          <h2 className="auth-aside-heading">{aside.heading}</h2>
          <p className="auth-aside-text">{aside.text}</p>
          <ul className="auth-aside-points">
            {aside.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

AuthLayout.propTypes = {
  navAction: PropTypes.object.isRequired,
  aside: PropTypes.shape({
    kicker: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    points: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
};
