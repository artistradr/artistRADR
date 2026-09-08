import { F } from "../constants";
import { fmtDate } from "../utils";
import PostActions from "./PostActions";
import FeatureControl from "./FeatureControl";

export default function PostRow({ post, isLast, deleting, togglePublish, deletePost, slotOccupants, pinningId, pinFeatured, unpinFeatured }) {
  // Native Supabase posts carry a joined profiles.full_name (via author_id).
  // Legacy WP-migrated posts have author_id = null and fall back to the
  // flat author_name text column. If neither is set, show a plain dash.
  const authorLabel = post.profiles?.full_name || post.author_name || "—";

  const statusBadge = (fontSize) => (
    <span style={{ fontSize, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: post.status === "published" ? "rgba(77,217,208,0.12)" : "rgba(255,255,255,0.06)", color: post.status === "published" ? "var(--color-cyan)" : "rgba(255,255,255,0.35)", border: `0.5px solid ${post.status === "published" ? "rgba(77,217,208,0.25)" : "rgba(255,255,255,0.1)"}` }}>
      {post.status}
    </span>
  );

  return (
    <div className="adm-row" style={{ padding: "16px 24px", borderBottom: isLast ? "none" : "0.5px solid rgba(255,255,255,0.05)" }}>
      {/* Desktop: single row + feature control below */}
      <div className="adm-desktop-only" style={{ flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {post.cover_url
            ? <img src={post.cover_url} alt="" style={{ width: "60px", height: "60px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: "60px", height: "60px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.d, fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "white", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: "rgba(77,217,208,0.12)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.25)" }}>{post.category}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(post.published_at)}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>·</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{authorLabel}</span>
            </div>
          </div>
          {statusBadge("10px")}
          <PostActions post={post} deleting={deleting} togglePublish={togglePublish} deletePost={deletePost} />
        </div>
        <FeatureControl post={post} slotOccupants={slotOccupants} isPinning={pinningId === post.id} onPin={pinFeatured} onUnpin={unpinFeatured} />
      </div>

      {/* Mobile: stacked card */}
      <div className="adm-mobile-only" style={{ flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {post.cover_url
            ? <img src={post.cover_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "9px", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: "48px", height: "48px", borderRadius: "9px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.d, fontSize: "0.88rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "white", marginBottom: "5px" }}>{post.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "100px", background: "rgba(77,217,208,0.12)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.25)" }}>{post.category}</span>
              <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(post.published_at)}</span>
              {statusBadge("9.5px")}
            </div>
            <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{authorLabel}</div>
          </div>
        </div>
        <PostActions post={post} deleting={deleting} togglePublish={togglePublish} deletePost={deletePost} stacked />
        <FeatureControl post={post} slotOccupants={slotOccupants} isPinning={pinningId === post.id} onPin={pinFeatured} onUnpin={unpinFeatured} stacked />
      </div>
    </div>
  );
}