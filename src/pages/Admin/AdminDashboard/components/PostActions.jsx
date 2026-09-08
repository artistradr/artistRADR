import { Link } from "react-router-dom";
import { F } from "../constants";

// Business rule: a published post can't be deleted directly — it must be
// unpublished (moved to draft) first. This prevents accidentally nuking a
// live post that readers/search engines may already be linking to. Drafts
// can still be deleted freely.
export default function PostActions({ post, deleting, togglePublish, deletePost, stacked }) {
  const isPublished = post.status === "published";

  return (
    <div style={{ display: "flex", gap: "8px", flexShrink: 0, ...(stacked ? { width: "100%" } : {}) }}>
      <Link
        to={`/admin/edit/${post.id}`}
        style={{ flex: stacked ? 1 : "0 0 auto", textAlign: "center", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, textDecoration: "none" }}
      >
        Edit
      </Link>
      <button
        onClick={() => togglePublish(post)}
        style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.25)", color: "var(--color-red)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={() => deletePost(post)}
        disabled={isPublished || deleting === post.id}
        title={isPublished ? "Unpublish this post before deleting it" : undefined}
        style={{
          flex: "0 0 auto",
          padding: "9px 14px",
          borderRadius: "8px",
          background: "rgba(255,50,50,0.08)",
          border: "0.5px solid rgba(255,50,50,0.2)",
          color: "#ff6b6b",
          fontFamily: F.b,
          fontSize: "12.5px",
          fontWeight: 600,
          cursor: isPublished ? "not-allowed" : "pointer",
          opacity: isPublished || deleting === post.id ? 0.4 : 1,
        }}
      >
        {deleting === post.id ? "…" : "Delete"}
      </button>
    </div>
  );
}