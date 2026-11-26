// src/studio/pages/CampaignPlaylistsPage.jsx
//
// One place for staff to post the playlist links that carry each campaign's song. Pick a
// campaign, paste a Spotify playlist link, look it up, attach it. The artist sees the
// attached playlists on their campaign preview. A second view lists every attached playlist
// across all campaigns. The Partner curators tab is a placeholder for later.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import CampaignPlaylists from "../components/CampaignPlaylists";
import AllCampaignPlaylists from "../components/AllCampaignPlaylists";
import PartnerCurators from "../components/PartnerCurators";
import { CAMPAIGN_CHIP, songArtist, songImage, songTitle } from "../components/campaignSong";
import "./playlists.css";
import "./campaigns.css";
import "./campaignPlaylistsPage.css";

const OPEN = ["pending", "active", "paused"];

const STATUS_OPTIONS = [
  { id: "open", label: "Waiting or running" },
  { id: "active", label: "Running" },
  { id: "pending", label: "Needs review" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`rc-kpi${tone ? ` ${tone}` : ""}`}>
      <div className="rc-kpi-label">{label}</div>
      <div className="rc-kpi-value">{value}</div>
      {hint && <div className="rc-kpi-hint">{hint}</div>}
    </div>
  );
}

function Art({ campaign }) {
  const url = songImage(campaign);
  if (!url) return <div className="cpp-art cpp-art-empty" />;
  return <img className="cpp-art" src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />;
}

export default function CampaignPlaylistsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("radr");
  const [view, setView] = useState("campaign");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("open");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadLinks = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("campaign_playlists")
      .select("id, campaign_id, spotify_playlist_id, title, image_url, created_at")
      .order("created_at");
    if (err) setError(err.message);
    else setLinks(data ?? []);
  }, []);

  const load = useCallback(async () => {
    setError("");
    const { data, error: err } = await supabase
      .from("campaigns")
      .select("*")
      .neq("status", "removed")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setCampaigns(data ?? []);
    await loadLinks();
    setLoading(false);
  }, [loadLinks]);

  useEffect(() => {
    load();
  }, [load]);

  // campaign id -> how many playlists are attached
  const counts = useMemo(() => {
    const n = new Map();
    links.forEach((l) => n.set(l.campaign_id, (n.get(l.campaign_id) ?? 0) + 1));
    return n;
  }, [links]);

  const stats = useMemo(() => {
    const open = campaigns.filter((c) => OPEN.includes(c.status));
    return {
      needing: open.filter((c) => !counts.get(c.id)).length,
      attached: links.length,
      unique: new Set(links.map((l) => l.spotify_playlist_id)).size,
    };
  }, [campaigns, links, counts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (status === "open" && !OPEN.includes(c.status)) return false;
      if (status !== "open" && status !== "all" && c.status !== status) return false;
      if (onlyEmpty && counts.get(c.id)) return false;
      if (!q) return true;
      return [songTitle(c), songArtist(c), c.name, c.artist_name].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [campaigns, status, onlyEmpty, query, counts]);

  const selected = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;

  // From the all-playlists view: jump to a campaign, clearing filters that could hide it.
  const openCampaign = (id) => {
    setSelectedId(id);
    setStatus("all");
    setOnlyEmpty(false);
    setQuery("");
    setView("campaign");
  };

  return (
    <div className="rc-page">
      <div className="rc-head">
        <div>
          <h1 className="rs-h1">Campaign playlists</h1>
          <p className="rs-sub" style={{ marginBottom: 0 }}>
            Post the playlist links that carry each campaign's song. Artists see the cover and link on their campaign
            preview. Find the playlists yourself, paste each link, and attach it.
          </p>
        </div>
        <button type="button" className="rs-btn" onClick={load}>Refresh</button>
      </div>

      <div className="rc-kpis">
        <Kpi
          label="Need playlists"
          value={stats.needing}
          hint="Open campaigns with none attached"
          tone={stats.needing ? "warn" : ""}
        />
        <Kpi label="Attached" value={stats.attached} hint="Playlist links across campaigns" />
        <Kpi label="Different playlists" value={stats.unique} hint="Counted once each" />
      </div>

      {error && <div className="rs-alert error">{error}</div>}

      <div className="rc-tabs cpp-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "radr"}
          className={`rc-tab${tab === "radr" ? " active" : ""}`}
          onClick={() => setTab("radr")}
        >
          Our playlists
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "partners"}
          className={`rc-tab${tab === "partners" ? " active" : ""}`}
          onClick={() => setTab("partners")}
        >
          Partner curators
          <span className="rc-tab-n">Soon</span>
        </button>
      </div>

      {tab === "partners" ? (
        <PartnerCurators />
      ) : loading ? (
        <div className="rc-empty">Loading…</div>
      ) : (
        <>
          <div className="cpp-views" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === "campaign"}
              className={`cpp-view${view === "campaign" ? " active" : ""}`}
              onClick={() => setView("campaign")}
            >
              By campaign
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "all"}
              className={`cpp-view${view === "all" ? " active" : ""}`}
              onClick={() => setView("all")}
            >
              All playlists
            </button>
          </div>

          {view === "all" ? (
            <AllCampaignPlaylists links={links} campaigns={campaigns} onOpen={openCampaign} />
          ) : (
            <div className="cpp-layout">
              <div className="cpp-side">
                <div className="cpp-filters">
                  <input
                    className="rc-input"
                    type="search"
                    placeholder="Search song or artist"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search campaigns"
                  />
                  <select
                    className="rc-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    aria-label="Campaign status"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <label className="cpp-check">
                  <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
                  Only campaigns with no playlists yet
                </label>

                <div className="cpp-list">
                  {visible.length === 0 && <div className="cpl-empty">No campaigns match this view.</div>}
                  {visible.map((c) => {
                    const n = counts.get(c.id) ?? 0;
                    const chip = CAMPAIGN_CHIP[c.status] ?? { label: c.status, tone: "" };
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`cpp-card${selected?.id === c.id ? " active" : ""}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <Art campaign={c} />
                        <span className="cpp-card-main">
                          <strong>{songTitle(c)}</strong>
                          <small>{songArtist(c) || "Unknown artist"}</small>
                          <span className="cpp-card-meta">
                            <span className={`rs-chip ${chip.tone}`}>{chip.label}</span>
                            <span className={`cpp-badge${n ? "" : " none"}`}>
                              {n ? `${n} ${n === 1 ? "playlist" : "playlists"}` : "None yet"}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cpp-detail">
                {selected ? (
                  <>
                    <div className="cpp-detail-head">
                      <Art campaign={selected} />
                      <div>
                        <h2 className="cpp-detail-title">{songTitle(selected)}</h2>
                        <div className="cpp-detail-sub">{songArtist(selected) || "Unknown artist"}</div>
                      </div>
                    </div>
                    <CampaignPlaylists key={selected.id} campaign={selected} onChange={loadLinks} />
                  </>
                ) : (
                  <div className="cpl-empty">Pick a campaign to attach playlists.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
