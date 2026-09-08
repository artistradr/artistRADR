import { Link } from "react-router-dom";
import { POST_CATEGORIES } from "../constants";
import { fmtDate } from "../utils";
import PostRow from "./PostRow";

export default function PostsTab({ posts, filteredPosts, loadingPosts, postFilter, setPostFilter, slotOccupants, deleting, togglePublish, deletePost, pinningId, pinFeatured, unpinFeatured }) {
  return (
    <>
      {/* Featured slots summary */}
      <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Featured Slots</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[1, 2, 3].map((slot) => {
            const occupant = slotOccupants[slot];
            return (
              <div key={slot} style={{ border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>Slot {slot}</div>
                {occupant ? (
                  <>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: "white", marginBottom: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{occupant.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-red)" }}>Ends {fmtDate(occupant.featured_until)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.3)" }}>Empty — auto-fills from latest</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="adm-scroll-x" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {POST_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            className="adm-filter"
            onClick={() => setPostFilter(value)}
            style={{ background: postFilter === value ? "var(--color-red)" : "transparent", borderColor: postFilter === value ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: postFilter === value ? "white" : "rgba(255,255,255,0.5)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
        {loadingPosts ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading posts…</div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            No posts found. <Link to="/admin/new" style={{ color: "var(--color-red)" }}>Create one →</Link>
          </div>
        ) : (
          filteredPosts.map((post, i) => (
            <PostRow
              key={post.id}
              post={post}
              isLast={i === filteredPosts.length - 1}
              deleting={deleting}
              togglePublish={togglePublish}
              deletePost={deletePost}
              slotOccupants={slotOccupants}
              pinningId={pinningId}
              pinFeatured={pinFeatured}
              unpinFeatured={unpinFeatured}
            />
          ))
        )}
      </div>
    </>
  );
}