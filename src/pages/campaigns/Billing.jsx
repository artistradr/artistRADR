// src/pages/campaigns/Billing.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";
import Breadcrumbs from "components/Breadcrumbs";
import AccountSidebar from "components/AccountSidebar";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "context/SupabaseAuthContext";
import { PLATFORM_META } from "./components/CampaignList";

const CAMPAIGN_STATUS = {
  active: { label: "Active", color: "#1DB954", bg: "rgba(29,185,84,0.1)" },
  pending: { label: "Pending Review", color: "#D9A02B", bg: "rgba(217,160,43,0.12)" },
  completed: { label: "Completed", color: "#888", bg: "rgba(0,0,0,0.05)" },
  paused: { label: "Paused", color: "#D94F2B", bg: "rgba(217,79,43,0.1)" },
};

const PAYMENT_STATUS = {
  paid: { label: "Paid", color: "#1DB954", bg: "rgba(29,185,84,0.1)" },
  pending: { label: "Pending", color: "#D9A02B", bg: "rgba(217,160,43,0.12)" },
  failed: { label: "Failed", color: "#D94F2B", bg: "rgba(217,79,43,0.1)" },
  refunded: { label: "Refunded", color: "#888", bg: "rgba(0,0,0,0.05)" },
};

// Postgres / PostgREST codes for "this table does not exist yet".
const MISSING_TABLE = ["42P01", "PGRST205"];

function money(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount) || 0);
}

function shortDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Totals are kept per currency so different currencies are never added together.
function totalPaid(payments) {
  const totals = {};
  payments
    .filter((p) => p.status === "paid")
    .forEach((p) => {
      totals[p.currency] = (totals[p.currency] || 0) + Number(p.amount);
    });
  const parts = Object.entries(totals).map(([currency, sum]) => money(sum, currency));
  return parts.length ? parts.join(" + ") : money(0);
}

function Pill({ meta }) {
  return (
    <span className="billing-pill" style={{ color: meta.color, background: meta.bg }}>
      {meta.label}
    </span>
  );
}

function Billing() {
  const { user } = useSupabaseAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignError, setCampaignError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, platform, status, budget, spent, next_billing, payment_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      // Filtered by user as well as by RLS: staff can read every row.
      supabase
        .from("payments")
        .select("id, campaign_id, amount, currency, status, method, reference, paid_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([campaignResult, paymentResult]) => {
      if (cancelled) return;
      if (campaignResult.error) setCampaignError(campaignResult.error.message);
      else setCampaigns(campaignResult.data ?? []);

      if (!paymentResult.error) setPayments(paymentResult.data ?? []);
      else if (!MISSING_TABLE.includes(paymentResult.error.code)) setPaymentError(paymentResult.error.message);

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Removed campaigns drop out of the plan list, but keep their name in history.
  const visible = campaigns.filter((c) => c.status !== "removed");
  const sumBudget = (status) =>
    visible.filter((c) => c.status === status).reduce((sum, c) => sum + Number(c.budget), 0);
  const campaignName = (id) => campaigns.find((c) => c.id === id)?.name ?? "Campaign";

  // A figure that failed to load shows a dash, never a misleading zero.
  const figure = (value, failed) => (loading ? "…" : failed ? "—" : value);

  const stats = [
    { label: "Total paid", value: figure(totalPaid(payments), paymentError) },
    { label: "Active monthly budget", value: figure(money(sumBudget("active")), campaignError) },
    { label: "Awaiting approval", value: figure(money(sumBudget("pending")), campaignError) },
  ];

  return (
    <>
      <SEOHead
        title="Billing — Payments & History"
        description="See your campaign budgets, payments and payment history on Artist RADR."
        path="/campaigns/billing"
      />

      <style>{`
        .billing-page { font-family: var(--font-body); background: #f7f6f3; min-height: 100vh; }
        .billing-shell {
          max-width: 1180px;
          margin: 24px auto 0;
          padding: 0 1.5rem 100px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 48px;
          align-items: start;
        }
        .billing-main { min-width: 0; }
        .billing-kicker {
          font-size: 10px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: #D94F2B; margin-bottom: 8px;
        }
        .billing-title {
          font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
          color: #111; line-height: 1.1; margin: 0 0 24px;
        }
        .billing-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .billing-stat, .billing-card {
          background: white; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 16px;
        }
        .billing-stat { padding: 20px; }
        .billing-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase; color: #999; margin-bottom: 8px;
        }
        .billing-stat-value {
          font-family: var(--font-display); font-size: 22px; font-weight: 800;
          color: #111; overflow-wrap: anywhere;
        }
        .billing-card { padding: 28px 32px; margin-bottom: 16px; }
        .billing-card-title {
          font-family: var(--font-display); font-size: 1rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px; color: #111; margin: 0 0 12px;
        }
        .billing-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 0; border-top: 0.5px solid rgba(0,0,0,0.06);
        }
        .billing-row-main { min-width: 0; }
        .billing-row-name { font-size: 14px; font-weight: 600; color: #111; overflow-wrap: anywhere; }
        .billing-row-sub { font-size: 12.5px; color: #999; margin-top: 3px; overflow-wrap: anywhere; }
        .billing-row-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .billing-row-amount { font-size: 14px; font-weight: 700; color: #111; }
        .billing-pill {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; padding: 4px 10px; border-radius: 100px;
        }
        .billing-empty {
          border-top: 0.5px solid rgba(0,0,0,0.06); padding: 22px 0 4px;
          font-size: 13.5px; color: #888; line-height: 1.6;
        }
        .billing-error {
          background: #FDECE8; border: 0.5px solid rgba(217,79,43,0.25); color: #B8391C;
          border-radius: 12px; padding: 14px 18px; font-size: 13px; margin-bottom: 16px;
        }
        .billing-help {
          background: #111; border-radius: 16px; padding: 24px 32px; display: flex;
          align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .billing-help-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; max-width: 420px; }
        .billing-help-link {
          background: #D94F2B; color: white; border-radius: 10px; padding: 12px 24px;
          font-size: 13px; font-weight: 700; text-decoration: none;
        }
        @media (max-width: 860px) {
          .billing-shell { grid-template-columns: 1fr; }
        }
        @media (max-width: 620px) {
          .billing-stats { grid-template-columns: 1fr; }
          .billing-card, .billing-help { padding: 22px 20px; }
        }
      `}</style>

      <div className="billing-page">
        <Navbar routes={routes} action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "110px 1.5rem 0" }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Billing", path: "/campaigns/billing" }]} />
        </div>

        <div className="billing-shell">
          <div className="billing-main">
            <div className="billing-kicker">Account</div>
            <h1 className="billing-title">Billing</h1>

            <div className="billing-stats">
              {stats.map((s) => (
                <div key={s.label} className="billing-stat">
                  <div className="billing-stat-label">{s.label}</div>
                  <div className="billing-stat-value">{s.value}</div>
                </div>
              ))}
            </div>

            {campaignError && <div className="billing-error">Couldn&apos;t load your campaigns. ({campaignError})</div>}
            {paymentError && <div className="billing-error">Couldn&apos;t load your payment history. ({paymentError})</div>}

            <section className="billing-card">
              <h2 className="billing-card-title">Campaign Billing</h2>
              {loading ? (
                <div className="billing-empty">Loading…</div>
              ) : campaignError ? (
                <div className="billing-empty">Campaigns are unavailable right now.</div>
              ) : !visible.length ? (
                <div className="billing-empty">No campaigns yet. Your budgets will appear here once you start one.</div>
              ) : (
                visible.map((c) => (
                  <div key={c.id} className="billing-row">
                    <div className="billing-row-main">
                      <div className="billing-row-name">{c.name}</div>
                      <div className="billing-row-sub">
                        {PLATFORM_META[c.platform]?.label ?? c.platform} · {money(c.spent)} spent
                        {c.next_billing && ` · Next billing ${shortDate(c.next_billing)}`}
                        {c.payment_method && ` · ${c.payment_method}`}
                      </div>
                    </div>
                    <div className="billing-row-meta">
                      <Pill meta={CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.pending} />
                      <span className="billing-row-amount">{money(c.budget)}/mo</span>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="billing-card">
              <h2 className="billing-card-title">Payment History</h2>
              {loading ? (
                <div className="billing-empty">Loading…</div>
              ) : paymentError ? (
                <div className="billing-empty">History is unavailable right now.</div>
              ) : !payments.length ? (
                <div className="billing-empty">No payments recorded yet.</div>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="billing-row">
                    <div className="billing-row-main">
                      <div className="billing-row-name">{campaignName(p.campaign_id)}</div>
                      <div className="billing-row-sub">
                        {shortDate(p.paid_at || p.created_at)}
                        {p.method && ` · ${p.method}`}
                        {p.reference && ` · Ref ${p.reference}`}
                      </div>
                    </div>
                    <div className="billing-row-meta">
                      <Pill meta={PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.pending} />
                      <span className="billing-row-amount">{money(p.amount, p.currency)}</span>
                    </div>
                  </div>
                ))
              )}
            </section>

            <div className="billing-help">
              <div className="billing-help-text">
                Online payment isn&apos;t available here yet. Contact us to arrange a payment or ask about a charge.
              </div>
              <Link to="/contact-us" className="billing-help-link">Contact Us</Link>
            </div>
          </div>

          <AccountSidebar activeKey="billing" />
        </div>

        <Footer />
      </div>
    </>
  );
}

export default Billing;
