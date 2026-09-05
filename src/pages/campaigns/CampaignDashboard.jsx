import { useEffect, useState, useCallback } from "react";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";
import { supabase } from "../../supabaseClient"; // relative — no Vite alias covers top-level src/ files (see MIGRATION.md)
import { useSupabaseAuth } from "context/SupabaseAuthContext";

import CampaignList from "./components/CampaignList";
import CampaignDetailPanel from "./components/CampaignDetailPanel";
import NewCampaignPanel from "./components/NewCampaignPanel";
import AccountSidebar from "components/AccountSidebar";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// DB (snake_case) -> UI (camelCase), matching CampaignList / CampaignDetailPanel's
// existing prop shape so those components need zero changes.
function rowToCampaign(row) {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    status: row.status,
    budget: Number(row.budget),
    spent: Number(row.spent),
    goal: row.goal ?? "",
    startedOn: row.started_on
      ? new Date(row.started_on).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    nextBilling: row.next_billing
      ? new Date(row.next_billing).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : row.status === "pending"
      ? "Awaiting approval"
      : "—",
    payment: row.payment_method ?? "—",
  };
}

function CampaignDashboard() {
  const { user } = useSupabaseAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setCampaigns((data ?? []).map(rowToCampaign));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  async function handleCreate(draft) {
    if (!user?.id) return;
    const { data, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: draft.name,
        platform: draft.platform,
        budget: draft.budget,
        goal: draft.goal ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }
    const newCampaign = rowToCampaign(data);
    setCampaigns((prev) => [newCampaign, ...prev]);
    setSelectedId(newCampaign.id);
    setCreating(false);
  }

  function handleSelect(id) {
    setSelectedId(id);
    setCreating(false);
  }

  function handleBack() {
    setSelectedId(null);
    setCreating(false);
  }

  function handleStartCampaign() {
    setCreating(true);
    setSelectedId(null);
  }

  async function handlePause() {
    if (!selected) return;
    const nextStatus = selected.status === "paused" ? "active" : "paused";
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ status: nextStatus })
      .eq("id", selected.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCampaigns((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, status: nextStatus } : c))
    );
  }

  async function handleRemove() {
    if (!selected) return;
    // Soft delete: keeps billing/history records intact instead of a hard DELETE.
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ status: "removed" })
      .eq("id", selected.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== selected.id));
    setSelectedId(null);
  }

  const showingDetail = creating || !!selected;

  return (
    <>
      <SEOHead
        title="Campaigns — Manage Your Promotion"
        description="Track and manage your active music promotion campaigns across Spotify, Apple Music, YouTube, and TikTok."
        path="/campaigns"
      />

      <style>{`
        .promo-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #D94F2B;
        }
        .promo-section-title {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #111;
          line-height: 1.1;
        }

        /* Same content width AND same grid pattern as BlogPage.jsx's
           .bp-layout — 1fr main column + fixed sidebar, 48px gap. */
        .campaign-shell {
          max-width: 1180px;
          margin: 24px auto 0;
          padding: 0 1.5rem 100px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 48px;
          align-items: start;
        }
        .campaign-main {
          min-width: 0;
        }
        .campaign-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .campaign-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 0;
          margin-bottom: 16px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: #888;
          cursor: pointer;
        }
        .campaign-back-link:hover {
          color: #D94F2B;
        }
        .campaign-new-btn {
          background: #D94F2B;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(217,79,43,0.3);
          white-space: nowrap;
        }
        .campaign-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .campaign-list-row {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          text-align: left;
          background: white;
          border: 0.5px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: box-shadow 200ms ease, border-color 200ms ease;
          font-family: var(--font-body);
        }
        .campaign-list-row:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .campaign-list-row--active {
          border-color: rgba(217,79,43,0.4);
          box-shadow: 0 8px 30px rgba(217,79,43,0.1);
        }
        .campaign-list-row-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f7f6f3;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .campaign-list-row-main {
          flex: 1;
          min-width: 0;
        }
        .campaign-list-row-name {
          font-family: var(--font-display);
          font-size: 14.5px;
          font-weight: 700;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .campaign-list-row-sub {
          font-size: 12.5px;
          color: #999;
          font-weight: 300;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .campaign-list-row-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }
        .campaign-list-status {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 100px;
        }
        .campaign-list-row-budget {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }
        .campaign-list-empty {
          background: white;
          border: 0.5px dashed rgba(0,0,0,0.15);
          border-radius: 16px;
          padding: 48px 24px;
          text-align: center;
        }
        .campaign-list-empty-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin-bottom: 6px;
        }
        .campaign-list-empty-sub {
          font-size: 13.5px;
          color: #888;
          font-weight: 300;
          max-width: 360px;
          margin: 0 auto;
        }

        /* Detail / New Campaign now render INSIDE the main column, not a
           separate 3rd column — content capped so it doesn't stretch edge
           to edge on wide screens. */
        .campaign-detail-panel, .campaign-new-panel {
          background: white;
          border-radius: 20px;
          border: 0.5px solid rgba(0,0,0,0.06);
          padding: 36px;
          max-width: 640px;
        }
        .campaign-detail-icon {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .campaign-detail-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: #111;
          line-height: 1.25;
        }
        .campaign-detail-sub {
          font-size: 13px;
          color: #999;
          font-weight: 300;
          margin-top: 4px;
          margin-bottom: 20px;
        }
        .campaign-detail-spend {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: #111;
        }
        .campaign-detail-spend span {
          font-size: 14px;
          font-weight: 500;
          color: #aaa;
        }
        .campaign-detail-progress {
          height: 6px;
          border-radius: 100px;
          background: rgba(0,0,0,0.06);
          margin: 10px 0 24px;
          overflow: hidden;
        }
        .campaign-detail-progress-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 300ms ease;
        }
        .campaign-detail-rows {
          border-top: 0.5px solid rgba(0,0,0,0.07);
          padding-top: 16px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .campaign-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #999;
          font-weight: 400;
        }
        .campaign-detail-row-value {
          color: #222;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
        }
        .campaign-detail-actions {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .campaign-detail-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          border-top: 0.5px solid rgba(0,0,0,0.06);
          padding: 14px 2px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 500;
          color: #111;
        }
        .campaign-detail-action-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .campaign-detail-action--danger {
          color: #D94F2B;
        }

        .campaign-new-panel-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: #111;
          margin-bottom: 6px;
        }
        .campaign-new-panel-sub {
          font-size: 13px;
          color: #888;
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .campaign-field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #999;
          margin-bottom: 8px;
          margin-top: 18px;
        }
        .campaign-field-label:first-of-type {
          margin-top: 0;
        }
        .campaign-field-input {
          width: 100%;
          box-sizing: border-box;
          border: 0.5px solid rgba(0,0,0,0.12);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13.5px;
          font-family: var(--font-body);
          color: #111;
          background: #fafafa;
        }
        .campaign-field-input:focus {
          outline: none;
          border-color: #D94F2B;
          background: white;
        }
        .campaign-platform-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .campaign-platform-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 0.5px solid rgba(0,0,0,0.12);
          background: #fafafa;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          color: #333;
        }
        .campaign-platform-btn--active {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .campaign-new-panel-actions {
          display: flex;
          gap: 10px;
          margin-top: 28px;
        }
        .campaign-new-panel-cancel {
          flex: 1;
          background: rgba(0,0,0,0.04);
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
        }
        .campaign-new-panel-submit {
          flex: 1.4;
          background: #D94F2B;
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(217,79,43,0.3);
        }

        .campaign-status-banner {
          background: white;
          border: 0.5px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          font-size: 13.5px;
          color: #888;
        }
        .campaign-error-banner {
          background: #FDECE8;
          border: 0.5px solid rgba(217,79,43,0.25);
          color: #B8391C;
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 13px;
          margin-bottom: 20px;
        }

        @media (max-width: 860px) {
          .campaign-shell {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "110px 1.5rem 0" }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Campaigns", path: "/campaigns" }]} />
        </div>

        <div className="campaign-shell">
          <div className="campaign-main">
            {showingDetail && (
              <button type="button" className="campaign-back-link" onClick={handleBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                All Campaigns
              </button>
            )}

            {!showingDetail && (
              <div className="campaign-header-row">
                <div>
                  <div className="promo-section-label" style={{ marginBottom: 8 }}>Campaign Dashboard</div>
                  <h1 className="promo-section-title" style={{ marginBottom: 0 }}>Your Campaigns</h1>
                </div>
                <button type="button" className="campaign-new-btn" onClick={handleStartCampaign}>
                  + New Campaign
                </button>
              </div>
            )}

            {error && <div className="campaign-error-banner">{error}</div>}

            {creating ? (
              <NewCampaignPanel onCancel={handleBack} onCreate={handleCreate} />
            ) : selected ? (
              <CampaignDetailPanel campaign={selected} onPause={handlePause} onRemove={handleRemove} />
            ) : loading ? (
              <div className="campaign-status-banner">Loading your campaigns…</div>
            ) : (
              <CampaignList campaigns={campaigns} selectedId={selectedId} onSelect={handleSelect} />
            )}
          </div>

          <AccountSidebar activeKey="campaigns" onStartCampaign={handleStartCampaign} />
        </div>

        <Footer />
      </div>
    </>
  );
}

export default CampaignDashboard;