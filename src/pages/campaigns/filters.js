// The dashboard's groups, used by both the header counts and the list tabs.
// `paid` is undefined when payments couldn't be read, so paid/unpaid is then unknown.
const always = () => true;
const paymentsKnown = (list) => list.every((c) => c.status !== "pending" || c.paid !== undefined);

export const FILTERS = [
  { id: "all", label: "All", match: always, known: always },
  { id: "active", label: "Active", stat: "Active", match: (c) => c.status === "active", known: always },
  { id: "review", label: "In review", stat: "In review", match: (c) => c.status === "pending" && c.paid === true, known: paymentsKnown },
  { id: "unpaid", label: "Unpaid", stat: "Unpaid", match: (c) => c.status === "pending" && c.paid === false, known: paymentsKnown },
  { id: "paused", label: "Paused", match: (c) => c.status === "paused", known: always },
  { id: "completed", label: "Completed", stat: "Completed", match: (c) => c.status === "completed", known: always },
];
