// src/studio/pages/CampaignsPage.jsx
//
// Artist promotion campaigns (the public /campaigns flow), reviewed by staff. This is
// separate from Submissions: a submission is a track sent for playlist consideration; a
// campaign is a paid promotion an artist started. New campaigns arrive as "pending".
// Approving one starts its duration clock; the hourly job completes it when time is up.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import CampaignPackageFacts from "../components/CampaignPackageFacts";
import CampaignPlaylists from "../components/CampaignPlaylists";
import { approvalDays } from "../components/campaignDays";
import "./playlists.css";
import "./campaigns.css";

const MIN = 60000;
const DAY = 86400000;

const PLATFORM = {
  spotify: "Spotify",
  apple_music: "Apple Music",
  youtube: "YouTube",
  tiktok: "TikTok",
  amazon_music: "Amazon Music",
  deezer: "Deezer",
};

const TABS = [
  { id: "review", label: "Needs review" },
  { id: "running", label: "Running" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const day = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

// One place that turns a database row into what the dashboard shows.
function describe(c, now) {
  const started = c.campaign_started_at ? new Date(c.campaign_started_at).getTime() : null;
  const ends = c.campaign_ends_at ? new Date(c.campaign_ends_at).getTime() : null;
  const total = started && ends ? ends - started : null;
  const left = ends ? ends - now : null;
  const pct = total ? Math.min(100, Math.max(0, ((now - started) / total) * 100)) : 0;
  const daysLeft = left === null ? null : Math.max(0, Math.ceil(left / DAY));
  const dayNo = started ? Math.min(c.campaign_days || 0, Math.max(1, Math.floor((now - started) / DAY) + 1)) : 0;

  let tab = "closed";
  let label = "Closed";
  let tone = "";
  if (c.status === "pending") {
    tab = "review";
    label = "Needs review";
    tone = "warn";
  } else if (c.status === "active") {
    tab = "running";
    label = "Running";
    tone = "live";
  } else if (c.status === "paused") {
    tab = "paused";
    label = "Paused";
    tone = "next";
  } else if (c.status === "completed") {
    tab = "completed";
    label = "Completed";
  } else if (c.status === "removed") {
    label = c.reviewed_by && !c.campaign_started_at ? "Rejected" : "Cancelled";
  }

  let progressText = "";
  if (c.status === "pending") progressText = "Not started";
  else if (c.status === "removed") progressText = "—";
  else if (c.status === "completed") progressText = `Finished ${day(c.campaign_ends_at)}`;
  else if (started) progressText = `Day ${dayNo} of ${c.campaign_days} · ${daysLeft}d left`;

  const endingSoon = c.status === "active" && daysLeft !== null && daysLeft <= 3;
  return { tab, label, tone, pct, progressText, daysLeft, endingSoon };
}

function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`rc-kpi${tone ? ` ${tone}` : ""}`}>
      <div className="rc-kpi-label">{label}</div>
      <div className="rc-kpi-value">{value}</div>
      {hint && <div className="rc-kpi-hint">{hint}</div>}
    </div>
  );
}

export default function CampaignsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState("review");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [days, setDays] = useState({}); // campaign id -> days text
  const [notes, setNotes] = useState({}); // campaign id -> rejection note
  const [spent, setSpent] = useState({}); // campaign id -> spent text

  const load = useCallback(async () => {
    setError("");
    // Finish any campaign whose time is up before listing.
    await supabase.rpc("studio_resolve_expired_campaigns");
    const { data, error: err } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep countdowns moving and re-check for finished campaigns every few minutes.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), MIN);
    const refresh = setInterval(load, 5 * MIN);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [load]);

  const items = useMemo(() => rows.map((c) => ({ c, d: describe(c, now) })), [rows, now]);

  const counts = useMemo(() => {
    const n = { review: 0, running: 0, paused: 0, completed: 0, closed: 0, all: items.length, soon: 0, budget: 0, spent: 0 };
    items.forEach(({ c, d }) => {
      n[d.tab] += 1;
      if (d.endingSoon) n.soon += 1;
      if (d.tab === "running" || d.tab === "paused") {
        n.budget += Number(c.budget || 0);
        n.spent += Number(c.spent || 0);
      }
    });
    return n;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(({ c, d }) => {
      if (tab !== "all" && d.tab !== tab) return false;
      if (platform !== "all" && c.platform !== platform) return false;
      if (!q) return true;
      return [c.name, c.artist_name, c.contact_email, c.goal].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [items, tab, platform, query]);

  const run = async (c, patch, okMessage) => {
    setError("");
    setNotice("");
    setBusy(c.id);
    const { error: err } = await supabase.from("campaigns").update(patch).eq("id", c.id);
    setBusy(null);
    if (err) {
      setError(err.message);
      return false;
    }
    setNotice(okMessage);
    await load();
    return true;
  };

  const parseDays = (c, fallback) => {
    const n = Number(days[c.id] ?? fallback);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      setError("Campaign days must be a whole number from 1 to 365.");
      return null;
    }
    return n;
  };

  const approve = async (c) => {
    const n = parseDays(c, approvalDays(c));
    if (n === null) return;
    const ok = await run(c, { campaign_days: n, status: "active" }, `Approved. "${c.name}" is running for ${n} days.`);
    if (ok) setTab("running");
  };

  const reject = async (c) => {
    const note = (notes[c.id] || "").trim();
    await run(c, { status: "removed", review_note: note || null }, `Rejected "${c.name}".`);
  };

  const saveDays = async (c) => {
    const n = parseDays(c, c.campaign_days ?? 14);
    if (n === null) return;
    await run(c, { campaign_days: n }, `"${c.name}" now runs for ${n} days.`);
  };

  const saveSpent = async (c) => {
    const n = Number(spent[c.id]);
    if (!Number.isFinite(n) || n < 0) {
      setError("Spent must be a number, zero or more.");
      return;
    }
    await run(c, { spent: n }, `Updated spend for "${c.name}".`);
  };

  return (
    <div className="rc-page">
      <div className="rc-head">
        <div>
          <h1 className="rs-h1">Campaigns</h1>
          <p className="rs-sub" style={{ marginBottom: 0 }}>
            Promotion campaigns artists start on the site. Review new ones, set how long each runs, then track them
            until they finish. Track submissions for playlists are separate and stay in Submissions.
          </p>
        </div>
        <button type="button" className="rs-btn" onClick={load}>Refresh</button>
      </div>

      <div className="rc-kpis">
        <Kpi label="Needs review" value={counts.review} hint="Waiting for approval" tone={counts.review ? "warn" : ""} />
        <Kpi label="Running" value={counts.running} hint={counts.soon ? `${counts.soon} ending within 3 days` : "On schedule"} tone="live" />
        <Kpi label="Active budget" value={money(counts.budget)} hint={`${money(counts.spent)} spent`} />
        <Kpi label="Completed" value={counts.completed} hint={`${counts.paused} paused`} />
      </div>

      {error && <div className="rs-alert error">{error}</div>}
      {notice && <div className="rs-alert">{notice}</div>}

      <div className="rc-toolbar">
        <div className="rc-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`rc-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="rc-tab-n">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="rc-filters">
          <input
            className="rc-input"
            type="search"
            placeholder="Search artist, campaign, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search campaigns"
          />
          <select className="rc-input" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
            <option value="all">All platforms</option>
            {Object.entries(PLATFORM).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rc-table">
        <div className="rc-row rc-row-head">
          <span>Campaign</span>
          <span>Platform</span>
          <span>Budget</span>
          <span>Progress</span>
          <span>Status</span>
          <span />
        </div>

        {loading && <div className="rc-empty">Loading…</div>}
        {!loading && visible.length === 0 && (
          <div className="rc-empty">
            {tab === "review" ? "Nothing waiting for review." : "No campaigns match this view."}
          </div>
        )}

        {visible.map(({ c, d }) => {
          const open = openId === c.id;
          const isBusy = busy === c.id;
          const live = c.status === "active" || c.status === "paused";
          return (
            <div key={c.id} className={`rc-item${open ? " open" : ""}`}>
              <button
                type="button"
                className="rc-row rc-row-main"
                onClick={() => setOpenId(open ? null : c.id)}
                aria-expanded={open}
              >
                <span className="rc-name">
                  <strong>{c.name}</strong>
                  <small>{c.artist_name || "Unknown artist"}</small>
                </span>
                <span>{PLATFORM[c.platform] || c.platform}</span>
                <span>{money(c.budget)}</span>
                <span className="rc-progress">
                  <span className="rc-bar"><i style={{ width: `${d.pct}%` }} className={d.endingSoon ? "soon" : ""} /></span>
                  <small>{d.progressText}</small>
                </span>
                <span><span className={`rs-chip ${d.tone}`}>{d.label}</span></span>
                <span className="rc-caret">{open ? "−" : "+"}</span>
              </button>

              {open && (
                <div className="rc-detail">
                  <dl className="rc-facts">
                    <div><dt>Artist</dt><dd>{c.artist_name || "—"}</dd></div>
                    <div>
                      <dt>Contact</dt>
                      <dd>{c.contact_email ? <a href={`mailto:${c.contact_email}`}>{c.contact_email}</a> : "—"}</dd>
                    </div>
                    <div><dt>Goal</dt><dd>{c.goal || "—"}</dd></div>
                    <CampaignPackageFacts campaign={c} now={now} />
                    <div><dt>Submitted</dt><dd>{day(c.created_at)}</dd></div>
                    <div>
                      <dt>Duration</dt>
                      <dd>
                        {!c.campaign_days
                          ? "Set when approved"
                          : c.campaign_started_at
                            ? `${c.campaign_days} days (${day(c.campaign_started_at)} → ${day(c.campaign_ends_at)})`
                            : `${c.campaign_days} days, starts when approved`}
                      </dd>
                    </div>
                    <div><dt>Spent</dt><dd>{money(c.spent)} of {money(c.budget)}</dd></div>
                    {c.reviewed_at && <div><dt>Reviewed</dt><dd>{day(c.reviewed_at)}</dd></div>}
                    {c.review_note && <div><dt>Note</dt><dd>{c.review_note}</dd></div>}
                  </dl>

                  {c.status !== "removed" && <CampaignPlaylists campaign={c} />}

                  {c.status === "pending" && (
                    <div className="rc-actions">
                      <label className="rc-field">
                        <span>Run for (days)</span>
                        <input
                          className="rc-input" type="number" min={1} max={365}
                          value={days[c.id] ?? approvalDays(c)}
                          onChange={(e) => setDays((v) => ({ ...v, [c.id]: e.target.value }))}
                        />
                      </label>
                      <button type="button" className="rs-btn primary" disabled={isBusy} onClick={() => approve(c)}>
                        {isBusy ? "Saving…" : "Approve and start"}
                      </button>
                      <label className="rc-field grow">
                        <span>Rejection note (optional, internal)</span>
                        <input
                          className="rc-input" type="text" maxLength={300}
                          value={notes[c.id] ?? ""}
                          onChange={(e) => setNotes((v) => ({ ...v, [c.id]: e.target.value }))}
                        />
                      </label>
                      <button type="button" className="rs-btn danger" disabled={isBusy} onClick={() => reject(c)}>
                        Reject
                      </button>
                    </div>
                  )}

                  {live && (
                    <div className="rc-actions">
                      <label className="rc-field">
                        <span>Change days</span>
                        <input
                          className="rc-input" type="number" min={1} max={365}
                          value={days[c.id] ?? c.campaign_days ?? 14}
                          onChange={(e) => setDays((v) => ({ ...v, [c.id]: e.target.value }))}
                        />
                      </label>
                      <button type="button" className="rs-btn" disabled={isBusy} onClick={() => saveDays(c)}>Save days</button>
                      <label className="rc-field">
                        <span>Spent (USD)</span>
                        <input
                          className="rc-input" type="number" min={0} step="0.01"
                          value={spent[c.id] ?? c.spent ?? 0}
                          onChange={(e) => setSpent((v) => ({ ...v, [c.id]: e.target.value }))}
                        />
                      </label>
                      <button type="button" className="rs-btn" disabled={isBusy} onClick={() => saveSpent(c)}>Save spend</button>
                      <span className="rc-spacer" />
                      <button
                        type="button" className="rs-btn" disabled={isBusy}
                        onClick={() =>
                          run(c, { status: c.status === "active" ? "paused" : "active" }, c.status === "active" ? "Paused." : "Resumed.")
                        }
                      >
                        {c.status === "active" ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button" className="rs-btn" disabled={isBusy}
                        onClick={() => run(c, { status: "completed" }, `Marked "${c.name}" completed.`)}
                      >
                        Mark completed
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
