// src/studio/components/AllCampaignPlaylists.jsx
//
// Every playlist staff have attached to a campaign, grouped so one playlist that carries
// several songs shows once, with the campaigns it is attached to. Click a campaign to open
// it and attach more.

import { useMemo, useState } from "react";
import { songArtist, songTitle } from "./campaignSong";
import "./campaignPlaylists.css";

function Cover({ url }) {
  if (!url || !/^https:\/\//.test(url)) return <div className="cpl-cover cpl-cover-empty" />;
  return <img className="cpl-cover" src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />;
}

export default function AllCampaignPlaylists({ links, campaigns, onOpen }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const byId = new Map(campaigns.map((c) => [c.id, c]));
    const map = new Map();
    links.forEach((l) => {
      const c = byId.get(l.campaign_id);
      if (!c) return; // campaign was removed
      const g = map.get(l.spotify_playlist_id) ?? {
        id: l.spotify_playlist_id,
        title: l.title,
        image_url: l.image_url,
        items: [],
      };
      if (!g.title && l.title) g.title = l.title;
      if (!g.image_url && l.image_url) g.image_url = l.image_url;
      g.items.push(c);
      map.set(l.spotify_playlist_id, g);
    });
    return [...map.values()].sort(
      (a, b) => b.items.length - a.items.length || (a.title || "").localeCompare(b.title || "")
    );
  }, [links, campaigns]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? groups.filter((g) =>
        [g.title, ...g.items.flatMap((c) => [songTitle(c), songArtist(c)])].some((v) =>
          (v || "").toLowerCase().includes(q)
        )
      )
    : groups;

  return (
    <div className="cpp-all">
      <div className="cpp-toolbar">
        <input
          className="rc-input"
          type="search"
          placeholder="Search playlist, song or artist"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search attached playlists"
        />
        <span className="cpp-count">
          {visible.length} {visible.length === 1 ? "playlist" : "playlists"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="cpl-empty">
          {groups.length === 0
            ? "No playlists attached yet. Open a campaign and paste a Spotify playlist link."
            : "No playlists match that search."}
        </div>
      ) : (
        <div className="cpp-playlists">
          {visible.map((g) => (
            <div key={g.id} className="cpp-playlist">
              <Cover url={g.image_url} />
              <div className="cpp-playlist-main">
                <a
                  className="cpp-playlist-title"
                  href={`https://open.spotify.com/playlist/${g.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {g.title || "Spotify playlist"}
                </a>
                <div className="cpp-uses">
                  {g.items.map((c) => (
                    <button key={c.id} type="button" className="cpp-use" onClick={() => onOpen(c.id)}>
                      {songTitle(c)}
                      {songArtist(c) ? ` · ${songArtist(c)}` : ""}
                    </button>
                  ))}
                </div>
              </div>
              <span className="cpp-n">
                {g.items.length} {g.items.length === 1 ? "campaign" : "campaigns"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
