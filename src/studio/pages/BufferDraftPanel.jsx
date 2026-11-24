// src/studio/pages/BufferDraftPanel.jsx
// Sends a saved Top 10 image to Buffer as a DRAFT. Nothing is published from here:
// the draft waits in Buffer until someone approves and schedules it there.
import { useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../supabaseClient";

async function errMessage(error) {
  let m = error.message;
  try { m = (await error.context.json()).error || m; } catch { /* keep default */ }
  return m;
}

export default function BufferDraftPanel({ artworkId, getBlob, defaultCaption, inputStyle }) {
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("");
  const [kind, setKind] = useState("dark");
  const [caption, setCaption] = useState(defaultCaption);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const loadChannels = async () => {
    setBusy(true); setNote("");
    const { data, error } = await supabase.functions.invoke("studio-buffer", { body: { action: "channels" } });
    if (error) setNote(`Could not load channels: ${await errMessage(error)}`);
    else {
      setChannels(data?.channels ?? []);
      if (!data?.channels?.length) setNote("No channels found in this Buffer account.");
    }
    setBusy(false);
  };

  const send = async () => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) { setNote("Pick a channel first."); return; }
    setBusy(true); setNote("");
    try {
      const blob = await getBlob(kind);
      if (!blob) throw new Error("Could not read the image.");
      // Buffer fetches the image itself, so it must be at a public URL.
      const path = `top10/${crypto.randomUUID()}.png`;
      const up = await supabase.storage.from("studio-public").upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("studio-public").getPublicUrl(path);

      const { error } = await supabase.functions.invoke("studio-buffer", {
        body: {
          action: "create_draft",
          artwork_id: artworkId,
          channel_id: channel.id,
          channel_name: channel.name,
          service: channel.service,
          caption,
          image_url: pub.publicUrl,
        },
      });
      if (error) throw new Error(await errMessage(error));
      setNote(`Draft created in Buffer for ${channel.name}. Open Buffer to review and schedule it.`);
    } catch (e) {
      setNote(`Could not send: ${e.message || e}`);
    }
    setBusy(false);
  };

  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #333" }}>
      <b style={{ fontSize: 13 }}>Send to Buffer (draft only)</b>
      {!channels.length ? (
        <div style={{ marginTop: 8 }}>
          <button type="button" className="rs-signout" onClick={loadChannels} disabled={busy}>
            {busy ? "Loading…" : "Load Buffer channels"}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <select style={inputStyle} value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              <option value="">Pick a channel…</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id} style={{ color: "#000" }}>{c.name} ({c.service})</option>
              ))}
            </select>
            <select style={inputStyle} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="dark" style={{ color: "#000" }}>Dark image</option>
              <option value="light" style={{ color: "#000" }}>Light image</option>
            </select>
          </div>
          <textarea style={{ ...inputStyle, height: 150, marginTop: 8 }} value={caption} onChange={(e) => setCaption(e.target.value)} />
          <button type="button" className="rs-signout" style={{ marginTop: 8 }} onClick={send} disabled={busy || !channelId}>
            {busy ? "Sending…" : "Send as Buffer draft"}
          </button>
        </>
      )}
      {note && <p style={{ fontSize: 12, marginTop: 8 }}>{note}</p>}
    </div>
  );
}

BufferDraftPanel.propTypes = {
  artworkId: PropTypes.string.isRequired,
  getBlob: PropTypes.func.isRequired,
  defaultCaption: PropTypes.string.isRequired,
  inputStyle: PropTypes.object.isRequired,
};
