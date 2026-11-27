import { useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../../supabaseClient";
import { CATEGORIES } from "../constants";

const EMPTY = { category: "campaign", subject: "", message: "" };

export default function TicketForm({ userId, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const change = (e) => {
    setSent(false);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // The same limits are enforced by the database.
  const ready = form.subject.trim().length >= 3 && form.message.trim().length >= 10;

  async function submit(e) {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError("");
    const { error: err } = await supabase.from("support_tickets").insert({
      user_id: userId,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSending(false);
    if (err) {
      setError(`Your ticket wasn't sent. (${err.message})`);
      return;
    }
    setForm(EMPTY);
    setSent(true);
    onCreated();
  }

  return (
    <form className="profile-card" onSubmit={submit}>
      <div className="profile-form-head">
        <h2 className="profile-card-title">Submit a ticket</h2>
        <p className="profile-card-sub">Tell us what you need help with.</p>
      </div>

      <div className="profile-form-body support-fields">
        {error && <div className="profile-alert" role="alert">{error}</div>}
        <label className="profile-field">
          <span className="profile-label">Topic</span>
          <select className="profile-input" name="category" value={form.category} onChange={change}>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
        <label className="profile-field">
          <span className="profile-label">Subject</span>
          <input className="profile-input" name="subject" value={form.subject} onChange={change} maxLength={120} />
        </label>
        <label className="profile-field">
          <span className="profile-label">Message</span>
          <textarea className="profile-input support-message" name="message" value={form.message} onChange={change} maxLength={4000} rows={5} />
          <span className="profile-hint">At least 10 characters.</span>
        </label>
      </div>

      <div className="profile-form-foot">
        <span className="profile-status" role="status">{sent ? "✓ Ticket sent" : ""}</span>
        <button type="submit" className="profile-btn" disabled={!ready || sending}>
          {sending ? "Sending…" : "Submit ticket"}
        </button>
      </div>
    </form>
  );
}

TicketForm.propTypes = { userId: PropTypes.string, onCreated: PropTypes.func.isRequired };
