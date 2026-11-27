import PropTypes from "prop-types";
import { CATEGORIES, STATUSES } from "../constants";

const date = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function TicketList({ tickets, loading, failed }) {
  let empty = "";
  if (loading) empty = "Loading…";
  else if (failed) empty = "We couldn't load your tickets. Refresh to try again.";
  else if (!tickets.length) empty = "You haven't submitted any tickets yet.";

  return (
    <section className="profile-card">
      <div className="profile-form-head">
        <h2 className="profile-card-title">Your tickets</h2>
      </div>
      {empty ? (
        <p className="support-empty">{empty}</p>
      ) : (
        tickets.map((t) => (
          <details key={t.id} className="support-ticket">
            <summary>
              <span className="support-ticket-text">
                <span className="support-ticket-subject">{t.subject}</span>
                <span className="support-ticket-meta">{CATEGORIES[t.category]} · {date(t.created_at)}</span>
              </span>
              <span className={`support-pill support-pill--${t.status}`}>{STATUSES[t.status]}</span>
            </summary>
            <p className="support-ticket-body">{t.message}</p>
            {t.staff_reply && (
              <div className="support-reply">
                <strong>Artist RADR</strong>
                <p>{t.staff_reply}</p>
              </div>
            )}
          </details>
        ))
      )}
    </section>
  );
}

TicketList.propTypes = {
  tickets: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  failed: PropTypes.bool.isRequired,
};
