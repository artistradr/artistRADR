// src/studio/pages/Top10Generator.jsx
// Weekly Top 10 artwork. Design C is locked: header + track 1 from A, rows 2-10 + footer from B.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";

const W = 1080, H = 1350, O = "#FF5A1F", K = "#0B0B0B";
const f = (w, s, extra = "") => `${extra}${w} ${s}px Montserrat, sans-serif`;
const blank = () =>
  Array.from({ length: 10 }, (_, i) => ({ title: `Track title ${i + 1}`, artist: "Artist name", cover: "", img: null }));

function todayLabel() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "long" })} ${String(d.getFullYear()).slice(2)}`.toUpperCase();
}

function loadImg(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

// Spotify cover URLs end in a size code: 4851 = 64px, 1e02 = 300px, b273 = 640px. Use 640.
function bigCover(url) {
  return url ? url.replace(/ab67616d0000(4851|1e02)/, "ab67616d0000b273") : url;
}

function draw(ctx, T, titleLine, date, invert = false, logo = null, headerLabel = "") {
  const bg = invert ? "#FFFFFF" : K, fg = invert ? "#0B0B0B" : "#fff";
  const rowBg = invert ? "#F0F0F0" : "#181818", sub = invert ? "#666666" : "#A8A8A8";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const ls = (px) => { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; };
  const fit = (t, w, s, min, maxW) => {
    while (s > min) { ctx.font = f(w, s); if (ctx.measureText(t).width <= maxW) break; s -= 1; }
    return s;
  };
  const txt = (t, x, y, w, s, col, align = "left", maxW, min = 14) => {
    ls(0); ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    ctx.font = f(w, maxW ? fit(t, w, s, min, maxW) : s);
    ctx.fillText(t, x, y);
  };
  const cover = (img, x, y, s, label) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
    if (img) {
      const r = Math.max(s / img.width, s / img.height), w = img.width * r, h = img.height * r;
      ctx.drawImage(img, x + (s - w) / 2, y + (s - h) / 2, w, h);
    } else {
      ctx.fillStyle = "#C9C9C9"; ctx.fillRect(x, y, s, s);
      if (label) txt(label, x + s / 2, y + s / 2 + 6, 800, 18, "#555", "center");
    }
    ctx.restore();
  };

  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // header
  const label = (headerLabel || "ARTIST RADR").toUpperCase();
  const lsz = fit(label, 900, 24, 12, 500);
  ctx.font = f(900, lsz);
  const bw = Math.max(200, ctx.measureText(label).width + 48);
  ctx.fillStyle = O; ctx.fillRect(56, 44, bw, 48);
  txt(label, 56 + bw / 2, 78, 900, lsz, "#fff", "center");
  ls(-2); ctx.font = f(900, 118); ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText("TOP 10", 50, 206);
  txt(titleLine.toUpperCase(), W - 56, 150, 800, 26, O, "right", 380, 16);
  txt(date.toUpperCase(), W - 56, 190, 800, 26, fg, "right", 380, 16);
  // track 1
  const y1 = 252;
  cover(T[0].img, 56, y1, 230, "COVER #1");
  ctx.fillStyle = O; ctx.fillRect(306, y1, W - 56 - 306, 230);
  // "01" and the title share one line; the artist sits underneath.
  txt("01", 334, y1 + 124, 900, 76, "#fff");
  ctx.font = f(900, 76);
  const numW = ctx.measureText("01").width;
  const tx = 334 + numW + 22;
  txt(T[0].title.toUpperCase(), tx, y1 + 124, 900, 60, "#fff", "left", W - 56 - tx - 24, 22);
  txt(T[0].artist, 334, y1 + 176, 600, 32, "#fff", "left", W - 56 - 334 - 28, 16);
  // rows 2-10
  let y = y1 + 230 + 28;
  for (let i = 1; i < 10; i++) {
    ctx.fillStyle = rowBg; ctx.fillRect(56, y, W - 112, 72);
    txt(String(i + 1).padStart(2, "0"), 95, y + 49, 900, 36, O, "center");
    cover(T[i].img, 154, y, 72, "");
    txt(T[i].title, 246, y + 34, 800, 28, fg, "left", W - 56 - 246 - 20, 16);
    txt(T[i].artist, 246, y + 60, 600, 20, sub, "left", W - 56 - 246 - 20, 13);
    y += 80;
  }
  // footer
  const fy = H - 84;
  ctx.fillStyle = O; ctx.fillRect(0, fy, W, 84);
  // RADR logo, bottom left, no box: transparent PNG with a thin white outline so it stands out on orange
  if (logo) {
    const lh = 44, lw = lh * (logo.width / logo.height), lx = 56, ly = fy + (84 - lh) / 2;
    const sil = document.createElement("canvas");
    sil.width = logo.width; sil.height = logo.height;
    const sc = sil.getContext("2d");
    sc.drawImage(logo, 0, 0);
    sc.globalCompositeOperation = "source-in";
    sc.fillStyle = "#fff"; sc.fillRect(0, 0, sil.width, sil.height);
    const o = 3;
    for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]]) {
      ctx.drawImage(sil, lx + dx, ly + dy, lw, lh);
    }
    ctx.drawImage(logo, lx, ly, lw, lh);
  }
  txt("#RADRTOP10", W - 56, fy + 51, 800, 22, "#fff", "right");
}

export default function Top10Generator() {
  const canvasRef = useRef(null);
  const lightRef = useRef(null);
  const [logo, setLogo] = useState(null);
  const [tracks, setTracks] = useState(blank);
  const [titleLine, setTitleLine] = useState("THIS WEEK");
  const [date, setDate] = useState(todayLabel());
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistId, setPlaylistId] = useState("");
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [preset, setPreset] = useState("THIS WEEK");
  const [headerLabel, setHeaderLabel] = useState("ARTIST RADR");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      document.fonts.load(f(900, 40)),
      document.fonts.load(f(800, 20)),
      document.fonts.load(f(600, 20)),
    ]).catch(() => {}).then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    supabase
      .from("radr_playlists")
      .select("id, title")
      .eq("is_archived", false)
      .order("title")
      .then(({ data, error }) => {
        if (error) setMsg(`Could not load playlists: ${error.message}`);
        else setPlaylists(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (!fontsReady) return;
    const dark = canvasRef.current, light = lightRef.current;
    if (dark) draw(dark.getContext("2d"), tracks, titleLine, date, false, logo, headerLabel);
    if (light) draw(light.getContext("2d"), tracks, titleLine, date, true, logo, headerLabel);
  }, [tracks, titleLine, date, fontsReady, logo, headerLabel]);

  useEffect(() => { loadImg("/radr-logo.png").then(setLogo); }, []);

  const edit = (fn) => { setApproved(false); fn(); };
  const patch = (i, p) => edit(() => setTracks((t) => t.map((x, n) => (n === i ? { ...x, ...p } : x))));

  const setCoverUrl = async (i, url) => {
    const img = await loadImg(url);
    patch(i, { cover: url, img });
    setMsg(url && !img ? `Cover ${i + 1} could not load. Upload the image instead.` : "");
  };
  const setCoverFile = async (i, file) => {
    if (!file) return;
    patch(i, { cover: file.name, img: await loadImg(URL.createObjectURL(file)) });
  };

  const loadPlaylist = useCallback(async (id) => {
    if (!id) return;
    setLoading(true); setMsg("");
    const { data, error } = await supabase.functions.invoke("studio-spotify", {
      body: { action: "playlist_tracks", playlist_id: id },
    });
    if (error) {
      let m = error.message;
      try { m = (await error.context.json()).error || m; } catch { /* keep default */ }
      setMsg(`Could not load tracks: ${m}`);
      setLoading(false);
      return;
    }
    const list = (data?.tracks ?? []).slice(0, 10);
    const next = blank();
    await Promise.all(
      list.map(async (t, i) => {
        next[i] = {
          title: t.name || "",
          artist: (t.artists || []).join(", "),
          cover: bigCover(t.image) || "",
          img: await loadImg(bigCover(t.image)),
        };
      })
    );
    setApproved(false);
    setTracks(next);
    setLoading(false);
    if (list.length < 10) setMsg(`This playlist has only ${list.length} tracks. Add more or fill the rest by hand.`);
  }, []);

  // One click: clear everything, set the title line and today's date, load the playlist's top 10.
  const createTop10 = async () => {
    if (!playlistId) { setMsg("Pick a playlist first."); return; }
    setApproved(false);
    setTracks(blank());
    setTitleLine(preset);
    setDate(todayLabel());
    await loadPlaylist(playlistId);
  };

  const pickPlaylist = (id) => {
    setPlaylistId(id);
    const name = playlists.find((p) => p.id === id)?.title || "";
    setHeaderLabel(name || "ARTIST RADR");
    if (name.toLowerCase().includes("spotlight")) setPreset("RADR SPOTLIGHT");
  };

  const clearAll = () => {
    setApproved(false); setTracks(blank()); setTitleLine("THIS WEEK"); setDate(todayLabel());
    setPlaylistId(""); setPreset("THIS WEEK"); setHeaderLabel("ARTIST RADR"); setJson(""); setMsg("");
  };

  const loadJson = async () => {
    try {
      const a = JSON.parse(json);
      const next = blank();
      for (let i = 0; i < 10 && i < a.length; i++) {
        next[i] = { title: a[i].title || "", artist: a[i].artist || "", cover: a[i].cover || "", img: await loadImg(a[i].cover) };
      }
      setApproved(false); setTracks(next); setMsg("");
    } catch { setMsg("That JSON could not be read."); }
  };

  const blobOf = (ref) => new Promise((res) => ref.current.toBlob(res, "image/png"));

  // Only runs after Approve. Stores both PNGs privately and logs one row.
  const saveToLibrary = async () => {
    if (!approved) return;
    setSaving(true); setMsg("");
    try {
      const [dark, light] = await Promise.all([blobOf(canvasRef), blobOf(lightRef)]);
      if (!dark || !light) throw new Error("A cover image blocked the export. Upload that cover instead of using a URL.");
      const { data: u } = await supabase.auth.getUser();
      const stamp = Date.now();
      const darkPath = `top10/${stamp}-dark.png`, lightPath = `top10/${stamp}-light.png`;
      const up1 = await supabase.storage.from("studio-artwork").upload(darkPath, dark, { contentType: "image/png" });
      if (up1.error) throw up1.error;
      const up2 = await supabase.storage.from("studio-artwork").upload(lightPath, light, { contentType: "image/png" });
      if (up2.error) throw up2.error;
      const { error } = await supabase.from("top10_artworks").insert({
        playlist_id: playlistId || null,
        header_label: headerLabel,
        title_line: titleLine,
        date_label: date,
        tracks: tracks.map(({ title, artist, cover }) => ({ title, artist, cover })),
        dark_path: darkPath,
        light_path: lightPath,
        approved_by: u?.user?.id ?? null,
      });
      if (error) throw error;
      setMsg("Saved to library.");
    } catch (e) {
      setMsg(`Could not save: ${e.message || e}`);
    }
    setSaving(false);
  };

  const download = (ref, suffix) => {
    try {
      ref.current.toBlob((b) => {
        if (!b) { setMsg("A cover image blocked the export. Upload that cover instead of using a URL."); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `radr-top10-${suffix}-${Date.now()}.png`;
        a.click();
      }, "image/png");
    } catch { setMsg("A cover image blocked the export. Upload that cover instead of using a URL."); }
  };

  const inp = { padding: 8, border: "1px solid #444", background: "transparent", color: "inherit", font: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <>
      <h1 className="rs-h1">Top 10 Generator</h1>
      <p className="rs-sub">Pick a playlist or fill the 10 tracks, check the preview, approve it, then download the 1080×1350 image. Nothing is posted automatically.</p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,420px)", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <select style={inp} value={playlistId} onChange={(e) => pickPlaylist(e.target.value)}>
              <option value="">Pick a playlist…</option>
              {playlists.map((p) => <option key={p.id} value={p.id} style={{ color: "#000" }}>{p.title}</option>)}
            </select>
            <select style={inp} value={preset} onChange={(e) => setPreset(e.target.value)}>
              {["THIS WEEK", "THIS MONTH", "RADR SPOTLIGHT", "RADR PICKS"].map((v) => (
                <option key={v} value={v} style={{ color: "#000" }}>{v}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button type="button" className="rs-signout" onClick={createTop10} disabled={loading || !playlistId}>
              {loading ? "Creating…" : "Create Top 10"}
            </button>
            <button type="button" className="rs-signout" onClick={clearAll} disabled={loading}>Clear</button>
          </div>

          <input style={{ ...inp, marginBottom: 10 }} value={headerLabel} onChange={(e) => edit(() => setHeaderLabel(e.target.value))} placeholder="Header tag (defaults to the playlist name)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <input style={inp} value={titleLine} onChange={(e) => edit(() => setTitleLine(e.target.value))} placeholder="Title line" />
            <input style={inp} value={date} onChange={(e) => edit(() => setDate(e.target.value))} placeholder="Date" />
          </div>

          {tracks.map((t, i) => (
            <div key={`${i}-${t.cover}`} style={{ display: "grid", gridTemplateColumns: "26px 1.2fr 1fr 1fr 74px", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <b style={{ color: O }}>{i + 1}</b>
              <input style={inp} value={t.title} onChange={(e) => patch(i, { title: e.target.value })} placeholder="Title" />
              <input style={inp} value={t.artist} onChange={(e) => patch(i, { artist: e.target.value })} placeholder="Artist" />
              <input style={inp} defaultValue={t.cover} onBlur={(e) => e.target.value !== t.cover && setCoverUrl(i, e.target.value)} placeholder="Cover URL" />
              <label style={{ ...inp, textAlign: "center", cursor: "pointer" }}>
                Cover
                <input type="file" accept="image/*" hidden onChange={(e) => setCoverFile(i, e.target.files[0])} />
              </label>
            </div>
          ))}

          <textarea style={{ ...inp, height: 90, marginTop: 14 }} value={json} onChange={(e) => setJson(e.target.value)}
            placeholder='Or paste JSON: [{"title":"","artist":"","cover":"https://..."}]' />
          <button type="button" className="rs-signout" style={{ marginTop: 8 }} onClick={loadJson}>Load JSON</button>
        </div>

        <div>
          <p style={{ fontSize: 12, margin: "0 0 6px", opacity: 0.6 }}>Dark</p>
          <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", border: "1px solid #444" }} />
          <p style={{ fontSize: 12, margin: "14px 0 6px", opacity: 0.6 }}>Light</p>
          <canvas ref={lightRef} width={W} height={H} style={{ width: "100%", height: "auto", border: "1px solid #444" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="rs-signout" onClick={() => setApproved(true)} disabled={approved}>
              {approved ? "Approved ✓" : "Approve"}
            </button>
            <button type="button" className="rs-signout" onClick={() => download(canvasRef, "dark")} disabled={!approved}>Download Dark</button>
            <button type="button" className="rs-signout" onClick={() => download(lightRef, "light")} disabled={!approved}>Download Light</button>
            <button type="button" className="rs-signout" onClick={saveToLibrary} disabled={!approved || saving}>
              {saving ? "Saving…" : "Save to library"}
            </button>
          </div>
          {!approved && <p style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>Approve the preview to enable download. Any edit resets approval.</p>}
          {msg && <p style={{ fontSize: 12, marginTop: 8 }}>{msg}</p>}
        </div>
      </div>
    </>
  );
}
