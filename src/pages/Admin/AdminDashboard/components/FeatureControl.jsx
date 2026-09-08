import { useState } from "react";
import { F, FEATURE_DURATIONS } from "../constants";
import { isActivelyFeatured, fmtDateTime } from "../utils";

// Inline "pin to a featured slot" control. Shown per-post in the row.
// If the post is already actively featured, shows its slot/expiry + Unpin.
// Otherwise shows a Feature button that opens a slot + duration picker.
export default function FeatureControl({ post, slotOccupants, isPinning, onPin, onUnpin, stacked }) {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(post.featured_slot || 1);
  const [days, setDays] = useState(7);
  const active = isActivelyFeatured(post);

  if (active) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", ...(stacked ? { width: "100%" } : {}) }}>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "5px 10px", borderRadius: "100px", background: "rgba(217,79,43,0.12)", color: "var(--color-red)", border: "0.5px solid rgba(217,79,43,0.3)" }}>
          Featured · Slot {post.featured_slot} · Ends {fmtDateTime(post.featured_until)}
        </span>
        <button onClick={() => onUnpin(post.id)} disabled={isPinning} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isPinning ? 0.5 : 1 }}>
          Unpin
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(77,217,208,0.1)", border: "0.5px solid rgba(77,217,208,0.25)", color: "var(--color-cyan)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", ...(stacked ? { width: "100%" } : {}) }}>
        ☆ Feature
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px", ...(stacked ? { width: "100%" } : {}) }}>
      <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: "6px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.12)", color: "white", fontFamily: F.b, fontSize: "12px" }}>
        {[1, 2, 3].map((s) => (
          <option key={s} value={s}>
            Slot {s}{slotOccupants[s] ? ` — replaces "${slotOccupants[s].title}"` : " — empty"}
          </option>
        ))}
      </select>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: "6px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.12)", color: "white", fontFamily: F.b, fontSize: "12px" }}>
        {FEATURE_DURATIONS.map((d) => (
          <option key={d.days} value={d.days}>{d.label}</option>
        ))}
      </select>
      <button onClick={() => { onPin(post.id, slot, days); setOpen(false); }} disabled={isPinning} style={{ padding: "6px 12px", borderRadius: "6px", background: "var(--color-red)", border: "none", color: "white", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isPinning ? 0.6 : 1 }}>
        {isPinning ? "…" : "Pin"}
      </button>
      <button onClick={() => setOpen(false)} style={{ padding: "6px 10px", borderRadius: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: F.b, fontSize: "12px", cursor: "pointer" }}>
        Cancel
      </button>
    </div>
  );
}