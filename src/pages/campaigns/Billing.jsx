// src/pages/campaigns/Billing.jsx
import { useCallback, useEffect, useState } from "react";
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
import { packageName } from "./packages";
import PayButton from "./components/PayButton";
import PaymentReturn from "./components/PaymentReturn";
import "./styles/billing.css";

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
  // Bumped after a returning payment is checked, so the figures reload.
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((n) => n + 1), []);

  useEffect(() => window.scrollTo(0, 0), []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, platform, status, budget, spent, next_billing, payment_method, package")
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
  }, [user?.id, version]);

  // Removed campaigns drop out of the plan list, but keep their name in history.
  const visible = campaigns.filter((c) => c.status !== "removed");
  const sumBudget = (status) =>
    visible.filter((c) => c.status === status).reduce((sum, c) => sum + Number(c.budget), 0);
  const campaignName = (id) => campaigns.find((c) => c.id === id)?.name ?? "Campaign";

  const isPaid = (id) => payments.some((p) => p.campaign_id === id && p.status === "paid");

  // A figure that failed to load shows a dash, never a misleading zero.
  const figure = (value, failed) => (loading ? "…" : failed ? "—" : value);

  const stats = [
    { label: "Total paid", value: figure(totalPaid(payments), paymentError) },
    { label: "Active campaign budget", value: figure(money(sumBudget("active")), campaignError) },
    { label: "Awaiting approval", value: figure(money(sumBudget("pending")), campaignError) },
  ];

  return (
    <>
      <SEOHead
        title="Billing — Payments & History"
        description="See your campaign budgets, payments and payment history on Artist RADR."
        path="/campaigns/billing"
      />

      <div className="billing-page">
        <Navbar routes={routes} action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "110px 1.5rem 0" }}>
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Billing", path: "/campaigns/billing" }]} />
        </div>

        <div className="billing-shell">
          <div className="billing-main">
            <div className="billing-kicker">Account</div>
            <h1 className="billing-title">Billing</h1>

            <PaymentReturn onSettled={reload} />

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
                        {c.package && ` · ${packageName(c.package)} package`}
                        {c.next_billing && ` · Next billing ${shortDate(c.next_billing)}`}
                        {c.payment_method && ` · ${c.payment_method}`}
                      </div>
                    </div>
                    <div className="billing-row-meta">
                      <Pill meta={CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.pending} />
                      <span className="billing-row-amount">{money(c.budget)}</span>
                      {c.status === "pending" && !paymentError && !isPaid(c.id) && Number(c.budget) > 0 && (
                        <PayButton campaignId={c.id} />
                      )}
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
                Payments are processed by Paystack. Contact us if you have a question about a charge.
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
