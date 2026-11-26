// DB row (snake_case) -> the shape CampaignList and CampaignDetailPanel use.
function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function rowToCampaign(row) {
  let nextBilling = "—";
  if (row.next_billing) nextBilling = formatDate(row.next_billing);
  else if (row.status === "pending") nextBilling = "Awaiting approval";

  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    status: row.status,
    budget: Number(row.budget),
    spent: Number(row.spent),
    goal: row.goal ?? "",
    startedOn: row.started_on ? formatDate(row.started_on) : "—",
    nextBilling,
    payment: row.payment_method ?? "—",
  };
}
