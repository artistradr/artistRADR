// One place for how a campaign's status is shown. A pending campaign that hasn't been paid
// is "Unpaid"; only a paid, pending one is "Pending Review" (waiting for staff).
export const STATUS_META = {
  active: { label: "Active", color: "#1DB954", bg: "rgba(29,185,84,0.1)" },
  pending: { label: "Pending Review", color: "#D9A02B", bg: "rgba(217,160,43,0.12)" },
  completed: { label: "Completed", color: "#888", bg: "rgba(0,0,0,0.05)" },
  paused: { label: "Paused", color: "#D94F2B", bg: "rgba(217,79,43,0.1)" },
};

export const UNPAID_META = { label: "Unpaid", color: "#D94F2B", bg: "rgba(217,79,43,0.1)" };

// `paid` is true/false once payments have loaded, or undefined if they couldn't be read.
export function statusMeta(status, paid) {
  if (status === "pending" && paid === false) return UNPAID_META;
  return STATUS_META[status] ?? STATUS_META.pending;
}

// Only a pending campaign with no payment can be deleted.
export const canDelete = (status, paid) => status === "pending" && paid === false;
