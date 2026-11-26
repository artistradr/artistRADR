// How many days Studio suggests when staff approve a campaign. Staff can change it.
const DAY = 86400000;
const DEFAULT_DAYS = 14;

export function approvalDays(campaign, now = new Date()) {
  if (campaign.campaign_days) return campaign.campaign_days;
  if (campaign.package === "presave" && campaign.release_date) {
    const [y, m, d] = campaign.release_date.split("-").map(Number);
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const until = Math.round((Date.UTC(y, m - 1, d) - today) / DAY);
    // Run through release day itself.
    if (until >= 0) return Math.min(365, until + 1);
  }
  return DEFAULT_DAYS;
}
