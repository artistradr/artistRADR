// src/studio/pages/ArtworkLibrary.jsx
// Saved, approved Top 10 artwork. Staff download the images and copy the caption to post by hand.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET = "studio-artwork";

function captionOf(row) {
  const list = (row.tracks || [])
    .filter((t) => t.title)
    .map((t, i) => `${i + 1}. ${t.title}${t.artist ? ` - ${t.artist}` : ""}`)
    .join("\n");
  return `${row.header_label} ${row.title_line} · ${row.date_label}\n\n${list}\n\n#RADRTOP10`;
}

export default function ArtworkLibrary() {
  const [rows, setRows] = useState([]);
  const [urls, setUrls] = useState({});
  const [filter, setFilter] = useState("approved");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setMsg("");
    const { data, error } = await supabase
      .from("top10_artworks")
      .select("*")
      .eq("status", filter)
      .order("approved_at", { ascending: false });
    if (error) { setMsg(`Could not load the library: ${error.message}`); setRows([]); setLoading(false); return; }
    setRows(data || []);

    const paths = (data || []).flatMap((r) => [r.dark_path, r.light_path]);
    if (paths.length) {
      const { data: signed, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
      if (e2) setMsg(`Could not load previews: ${e2.message}`);
      const map = {};
      (signed || []).forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setUrls(map);
    } else {
      setUrls({});
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const download = async (path, name) => {
    setMsg("");
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) { setMsg(`Could not download: ${error?.message || "no file"}`); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(data);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const copyCaption = async (row) => {
    try {
      await navigator.clipboard.writeText(captionOf(row));
      setMsg("Caption copied.");
    } catch {
      setMsg("Could not copy. Select the caption text and copy it by hand.");
    }
  };

  const setStatus = async (row, status) => {
    const { error } = await supabase.from("top10_artworks").update({ status }).eq("id", row.id);
    if (error) { setMsg(`Could not update: ${error.message}`); return; }
    load();
  };

  const day = (d) => new Date(d).toISOString().slice(0, 10);
  const inp = { padding: 8, border: "1px solid #444", background: "transparent", color: "inherit", font: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <>
      <h1 className="rs-h1">Artwork library</h1>
      <p className="rs-sub">
        Approved Top 10 artwork. Download the image, copy the caption, then post it by hand.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" className="rs-signout" onClick={() => setFilter("approved")} disabled={filter === "approved"}>Approved</button>
        <button type="button" className="rs-signout" onClick={() => setFilter("archived")} disabled={filter === "archived"}>Archived</button>
      </div>

      {msg && <p style={{ fontSize: 13, marginBottom: 12 }}>{msg}</p>}
      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}
      {!loading && rows.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          {filter === "approved"
            ? "Nothing saved yet. In Top 10 Generator, approve a cover and click Save to library."
            : "No archived artwork."}
        </p>
      )}

      {rows.map((row) => (
        <div key={row.id} style={{ display: "grid", gridTemplateColumns: "150px 150px minmax(0,1fr)", gap: 16, alignItems: "start", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #333" }}>
          {[row.dark_path, row.light_path].map((p, i) => (
            urls[p]
              ? <img key={p} src={urls[p]} alt={`${row.title_line} ${i ? "light" : "dark"}`} style={{ width: "100%", height: "auto", border: "1px solid #444" }} />
              : <div key={p} style={{ aspectRatio: "1080 / 1350", border: "1px solid #444", opacity: 0.4 }} />
          ))}
          <div>
            <b>{row.header_label} · {row.title_line}</b>
            <div style={{ fontSize: 12, opacity: 0.6, margin: "2px 0 10px" }}>
              {row.date_label} · saved {day(row.approved_at)}
            </div>
            <textarea readOnly style={{ ...inp, height: 150, fontSize: 12 }} value={captionOf(row)} onFocus={(e) => e.target.select()} />
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button type="button" className="rs-signout" onClick={() => copyCaption(row)}>Copy caption</button>
              <button type="button" className="rs-signout" onClick={() => download(row.dark_path, `radr-top10-dark-${day(row.approved_at)}.png`)}>Download Dark</button>
              <button type="button" className="rs-signout" onClick={() => download(row.light_path, `radr-top10-light-${day(row.approved_at)}.png`)}>Download Light</button>
              {row.status === "approved"
                ? <button type="button" className="rs-signout" onClick={() => setStatus(row, "archived")}>Archive</button>
                : <button type="button" className="rs-signout" onClick={() => setStatus(row, "approved")}>Restore</button>}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
