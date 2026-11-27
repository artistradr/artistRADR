import { useEffect, useState } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";
import AccountSidebar from "components/AccountSidebar";
import { useSupabaseAuth } from "context/SupabaseAuthContext";

import CampaignList from "./components/CampaignList";
import CampaignOverview from "./components/CampaignOverview";
import CampaignDetailPanel from "./components/CampaignDetailPanel";
import NewCampaignFlow from "./flow/NewCampaignFlow";
import { useCampaigns } from "./useCampaigns";
import "./styles/dashboard.css";
import "./styles/detail.css";
import "./styles/premium.css";

function CampaignDashboard() {
  const { user } = useSupabaseAuth();
  const { campaigns, loading, error, createCampaign, deleteCampaign } = useCampaigns(user?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  // Set when renewing a finished campaign: the new campaign starts from its song and goal.
  const [renewFrom, setRenewFrom] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [creating]);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  function showList() {
    setSelectedId(null);
    setCreating(false);
    setRenewFrom(null);
  }

  function showCampaign(id) {
    setSelectedId(id);
    setCreating(false);
    setRenewFrom(null);
  }

  function startCampaign() {
    setSelectedId(null);
    setRenewFrom(null);
    setCreating(true);
  }

  function renewCampaign(campaign) {
    setSelectedId(null);
    setRenewFrom(campaign);
    setCreating(true);
  }

  // Back to the list once the campaign is gone. Errors are thrown to the Delete button.
  async function handleDelete(id) {
    await deleteCampaign(id);
    showList();
  }

  let content;
  if (selected) {
    content = (
      <CampaignDetailPanel campaign={selected} onRenew={() => renewCampaign(selected)} onDelete={handleDelete} />
    );
  } else if (loading) content = <div className="campaign-status-banner">Loading your campaigns…</div>;
  // After a failed load, don't claim there are no campaigns.
  else if (error && !campaigns.length) content = null;
  else content = <CampaignList campaigns={campaigns} onSelect={showCampaign} onStart={startCampaign} />;

  return (
    <>
      <SEOHead
        title="Campaigns — Manage Your Promotion"
        description="Track and manage your active music promotion campaigns across Spotify, Apple Music, YouTube, and TikTok."
        path="/campaigns"
      />

      <div className="campaign-page">
        <Navbar routes={routes} action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }} />

        <div className="campaign-crumbs">
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Campaigns", path: "/campaigns" }]} />
        </div>

        <div className="campaign-shell">
          <div className="campaign-main">
            {creating ? (
              <>
                <div className="campaign-kicker">Campaign Dashboard</div>
                <h1 className="campaign-title campaign-title--spaced">{renewFrom ? "Renew Campaign" : "New Campaign"}</h1>
                <NewCampaignFlow onExit={showList} onCreate={createCampaign} onView={showCampaign} renewFrom={renewFrom} />
              </>
            ) : (
              <>
                {selected ? (
                  <button type="button" className="campaign-back-link" onClick={showList}>
                    ← All Campaigns
                  </button>
                ) : (
                  <CampaignOverview campaigns={campaigns} loading={loading} failed={Boolean(error) && !campaigns.length} onStart={startCampaign} />
                )}
                {error && <div className="campaign-error-banner">{error}</div>}
                {content}
              </>
            )}
          </div>

          <AccountSidebar activeKey="campaigns" onStartCampaign={startCampaign} />
        </div>

        <Footer />
      </div>
    </>
  );
}

export default CampaignDashboard;
