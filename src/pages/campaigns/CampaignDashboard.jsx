import { useEffect, useState } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";
import AccountSidebar from "components/AccountSidebar";
import { useSupabaseAuth } from "context/SupabaseAuthContext";

import CampaignList from "./components/CampaignList";
import CampaignDetailPanel from "./components/CampaignDetailPanel";
import NewCampaignFlow from "./flow/NewCampaignFlow";
import { useCampaigns } from "./useCampaigns";
import "./styles/dashboard.css";
import "./styles/detail.css";

function CampaignDashboard() {
  const { user } = useSupabaseAuth();
  const { campaigns, loading, error, createCampaign, togglePause } = useCampaigns(user?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [creating]);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  function showList() {
    setSelectedId(null);
    setCreating(false);
  }

  function showCampaign(id) {
    setSelectedId(id);
    setCreating(false);
  }

  function startCampaign() {
    setSelectedId(null);
    setCreating(true);
  }

  let content;
  if (selected) content = <CampaignDetailPanel campaign={selected} onPause={() => togglePause(selected)} />;
  else if (loading) content = <div className="campaign-status-banner">Loading your campaigns…</div>;
  else content = <CampaignList campaigns={campaigns} selectedId={selectedId} onSelect={showCampaign} />;

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

        {/* The new campaign flow takes the full width, like a checkout page. */}
        {creating ? (
          <div className="campaign-flow-shell">
            <NewCampaignFlow onExit={showList} onCreate={createCampaign} onView={showCampaign} />
          </div>
        ) : (
          <div className="campaign-shell">
            <div className="campaign-main">
              {selected ? (
                <button type="button" className="campaign-back-link" onClick={showList}>
                  ← All Campaigns
                </button>
              ) : (
                <div className="campaign-header-row">
                  <div>
                    <div className="campaign-kicker">Campaign Dashboard</div>
                    <h1 className="campaign-title">Your Campaigns</h1>
                  </div>
                  <button type="button" className="campaign-new-btn" onClick={startCampaign}>
                    + New Campaign
                  </button>
                </div>
              )}

              {error && <div className="campaign-error-banner">{error}</div>}
              {content}
            </div>

            <AccountSidebar activeKey="campaigns" onStartCampaign={startCampaign} />
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}

export default CampaignDashboard;
