import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Keep this list in sync with:
//  - public.posts_category_check (DB constraint, Supabase project rjivkemajotafjvtalol)
//  - PostEditor.jsx's CATEGORIES
//  - BlogPage.jsx's CATEGORIES
const POST_CATEGORIES = [
  { value: "all", label: "All Posts" },
  { value: "new-release", label: "New Release" },
  { value: "on-your-radr", label: "On Your RADR" },
  { value: "playlist", label: "Playlist" },
  { value: "spotlights", label: "Spotlights" },
  { value: "single", label: "Single" },
  { value: "album", label: "Album" },
  { value: "ep", label: "EP" },
  { value: "news", label: "News" },
  { value: "updates", label: "Updates" },
  { value: "trending", label: "Trending" },
];

const SUB_STATUSES = [
  { value: "all",      label: "All" },
  { value: "open",     label: "Open" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLOR = {
  open:     "#D94F2B",
  approved: "#22c55e",
  rejected: "#ff6b6b",
};

// Duration options offered when pinning a post to a featured slot.
const FEATURE_DURATIONS = [
  { days: 7,  label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];

function NavLink({ to, label, icon, active, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", marginBottom: "4px", textDecoration: "none", color: active ? "white" : "rgba(255,255,255,0.55)", fontFamily: F.b, fontSize: "13.5px", fontWeight: 500, background: active ? "rgba(217,79,43,0.15)" : "transparent" }}>
      <span style={{ fontSize: "15px" }}>{icon}</span>{label}
    </Link>
  );
}

function StatCard({ label, val, accent }) {
  return (
    <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px 20px" }}>
      <div style={{ fontFamily: F.d, fontSize: "1.8rem", fontWeight: 800, color: accent || "var(--color-red)", lineHeight: 1, marginBottom: "4px" }}>{val}</div>
      <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// A post counts as actively featured only while featured_until is in the
// future. A stale featured_slot with a past featured_until is treated as
// not featured — the blog page applies the same rule when picking who shows
// in the top-3 strip.
function isActivelyFeatured(post) {
  return Boolean(post.featured_slot) && Boolean(post.featured_until) && new Date(post.featured_until) > new Date();
}

function fmtDateTime(ts) {
  return ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
}

// Inline "pin to a featured slot" control. Shown per-post in the row.
// If the post is already actively featured, shows its slot/expiry + Unpin.
// Otherwise shows a Feature button that opens a slot + duration picker.
function FeatureControl({ post, slotOccupants, isPinning, onPin, onUnpin, stacked }) {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(post.featured_slot || 1);
  const [days, setDays] = useState(7);
  const active = isActivelyFeatured(post);

  if (active) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", ...(stacked ? { width: "100%" } : {}) }}>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "5px 10px", borderRadius: "100px", background: "rgba(217,79,43,0.12)", color: "var(--color-red)", border: "0.5px solid rgba(217,79,43,0.3)" }}>
          Featured · Slot {post.featured_slot} · Ends {fmtDateTime(post.featured_until)}
        </span>
        <button onClick={() => onUnpin(post.id)} disabled={isPinning} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isPinning ? 0.5 : 1 }}>
          Unpin
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(77,217,208,0.1)", border: "0.5px solid rgba(77,217,208,0.25)", color: "var(--color-cyan)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", ...(stacked ? { width: "100%" } : {}) }}>
        ☆ Feature
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px", ...(stacked ? { width: "100%" } : {}) }}>
      <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: "6px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.12)", color: "white", fontFamily: F.b, fontSize: "12px" }}>
        {[1, 2, 3].map((s) => (
          <option key={s} value={s}>
            Slot {s}{slotOccupants[s] ? ` — replaces "${slotOccupants[s].title}"` : " — empty"}
          </option>
        ))}
      </select>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: "6px", background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.12)", color: "white", fontFamily: F.b, fontSize: "12px" }}>
        {FEATURE_DURATIONS.map((d) => (
          <option key={d.days} value={d.days}>{d.label}</option>
        ))}
      </select>
      <button onClick={() => { onPin(post.id, slot, days); setOpen(false); }} disabled={isPinning} style={{ padding: "6px 12px", borderRadius: "6px", background: "var(--color-red)", border: "none", color: "white", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isPinning ? 0.6 : 1 }}>
        {isPinning ? "…" : "Pin"}
      </button>
      <button onClick={() => setOpen(false)} style={{ padding: "6px 10px", borderRadius: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: F.b, fontSize: "12px", cursor: "pointer" }}>
        Cancel
      </button>
    </div>
  );
}

function PostActions({ post, deleting, togglePublish, deletePost, stacked }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexShrink: 0, ...(stacked ? { width: "100%" } : {}) }}>
      <Link to={`/admin/edit/${post.id}`} style={{ flex: stacked ? 1 : "0 0 auto", textAlign: "center", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, textDecoration: "none" }}>
        Edit
      </Link>
      <button onClick={() => togglePublish(post)} style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.25)", color: "var(--color-red)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
        {post.status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button onClick={() => deletePost(post.id)} disabled={deleting === post.id} style={{ flex: "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,50,50,0.08)", border: "0.5px solid rgba(255,50,50,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: deleting === post.id ? 0.5 : 1 }}>
        {deleting === post.id ? "…" : "Delete"}
      </button>
    </div>
  );
}

function SubActions({ sub, isUpdating, deleting, updateSubmissionStatus, deleteSubmission, stacked }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexShrink: 0, ...(stacked ? { width: "100%" } : {}) }} onClick={(e) => e.stopPropagation()}>
      {sub.status === "open" ? (
        <>
          <button onClick={() => updateSubmissionStatus(sub.id, "approved")} disabled={isUpdating}
            style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.25)", color: "#22c55e", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
            {isUpdating ? "…" : "Approve"}
          </button>
          <button onClick={() => updateSubmissionStatus(sub.id, "rejected")} disabled={isUpdating}
            style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,80,80,0.08)", border: "0.5px solid rgba(255,80,80,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
            {isUpdating ? "…" : "Reject"}
          </button>
        </>
      ) : (
        <button onClick={() => updateSubmissionStatus(sub.id, "open")} disabled={isUpdating}
          title="Revert to open — does not send another email"
          style={{ flex: stacked ? 1 : "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
          {isUpdating ? "…" : "Reopen"}
        </button>
      )}
      <button onClick={() => deleteSubmission(sub.id)} disabled={deleting === sub.id}
        style={{ flex: "0 0 auto", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,50,50,0.08)", border: "0.5px solid rgba(255,50,50,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: deleting === sub.id ? 0.5 : 1 }}>
        {deleting === sub.id ? "…" : "Delete"}
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const { userRole, loading, roleLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState("posts");        // "posts" | "submissions"
  const [posts, setPosts]       = useState([]);
  const [subs, setSubs]         = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSubs, setLoadingSubs]   = useState(true);
  const [postFilter, setPostFilter]     = useState("all");
  const [subFilter, setSubFilter]       = useState("all");
  const [deleting, setDeleting]         = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // submission id currently being updated
  const [pinningId, setPinningId]       = useState(null);     // post id currently being pinned/unpinned
  const [expanded, setExpanded]         = useState(null);   // expanded submission id
  const [sidebarOpen, setSidebarOpen]   = useState(false);  // mobile drawer

  useEffect(() => {
    // Wait for both the session AND the role fetch to resolve before gating.
    // userRole starts null while roleLoading is true — redirecting on that
    // transient null was the "roleLoading redirect-loop bug" noted in
    // MIGRATION.md. Only act once we actually know the answer.
    if (loading || roleLoading) return;
    if (userRole !== "radrStaff") { navigate("/"); return; }
    fetchPosts();
    fetchSubmissions();
  }, [userRole, loading, roleLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) console.error(error);
    else setPosts(data);
    setLoadingPosts(false);
  };

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    const { data, error } = await supabase
      .from("playlist_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) console.error(error);
    else setSubs(data);
    setLoadingSubs(false);
  };

  const togglePublish = async (post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("posts").update({ status: newStatus }).eq("id", post.id);
    if (error) { console.error(error); return; }
    setPosts((p) => p.map((x) => x.id === post.id ? { ...x, status: newStatus } : x));
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(id);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) console.error(error);
    else setPosts((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  // Pins `postId` to `slot` (1/2/3) for `days` days from now.
  // The DB has a partial unique index on featured_slot (where not null), so
  // whoever currently holds that slot must be cleared first, in a separate
  // update. These two writes are not atomic — if two admins pin to the same
  // slot within the same round trip, the second write wins and the first
  // is silently bumped. Acceptable for a single-admin dashboard; worth a
  // proper RPC/transaction if this ever gets more than one concurrent editor.
  const pinFeatured = async (postId, slot, days) => {
    setPinningId(postId);
    const currentOccupant = posts.find((p) => p.id !== postId && p.featured_slot === slot);
    if (currentOccupant) {
      const { error: clearError } = await supabase
        .from("posts")
        .update({ featured_slot: null, featured_until: null, featured_pinned_at: null })
        .eq("id", currentOccupant.id);
      if (clearError) {
        console.error(clearError);
        window.alert("Couldn't clear the existing slot occupant — check console.");
        setPinningId(null);
        return;
      }
    }

    const now = new Date();
    const featuredUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ featured_slot: slot, featured_until: featuredUntil, featured_pinned_at: now.toISOString() })
      .eq("id", postId);
    if (error) {
      console.error(error);
      window.alert("Couldn't pin this post — check console for details.");
      setPinningId(null);
      return;
    }

    setPosts((p) => p.map((x) => {
      if (x.id === postId) return { ...x, featured_slot: slot, featured_until: featuredUntil, featured_pinned_at: now.toISOString() };
      if (currentOccupant && x.id === currentOccupant.id) return { ...x, featured_slot: null, featured_until: null, featured_pinned_at: null };
      return x;
    }));
    setPinningId(null);
  };

  const unpinFeatured = async (postId) => {
    setPinningId(postId);
    const { error } = await supabase
      .from("posts")
      .update({ featured_slot: null, featured_until: null, featured_pinned_at: null })
      .eq("id", postId);
    if (error) {
      console.error(error);
      window.alert("Couldn't unpin this post — check console for details.");
      setPinningId(null);
      return;
    }
    setPosts((p) => p.map((x) => x.id === postId ? { ...x, featured_slot: null, featured_until: null, featured_pinned_at: null } : x));
    setPinningId(null);
  };

  // Setting status to "approved" or "rejected" fires the Supabase trigger
  // (on_submission_status_notify) which emails the submitter their outcome
  // via Resend. Setting it back to "open" does NOT re-fire that email —
  // it's a plain status revert for correcting a mis-click.
  const updateSubmissionStatus = async (id, status) => {
    setUpdatingStatus(id);
    const { error } = await supabase.from("playlist_submissions").update({ status }).eq("id", id);
    if (error) {
      console.error(error);
      window.alert("Couldn't update status — check console for details.");
      setUpdatingStatus(null);
      return;
    }
    setSubs((p) => p.map((x) => x.id === id ? { ...x, status } : x));
    setUpdatingStatus(null);
  };

  const deleteSubmission = async (id) => {
    if (!window.confirm("Delete this submission permanently?")) return;
    setDeleting(id);
    const { error } = await supabase.from("playlist_submissions").delete().eq("id", id);
    if (error) console.error(error);
    else setSubs((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const filteredPosts = postFilter === "all" ? posts : posts.filter((p) => p.category === postFilter);
  const filteredSubs  = subFilter  === "all" ? subs  : subs.filter((s) => s.status === subFilter);
  const openCount     = subs.filter((s) => s.status === "open").length;
  const approvedCount = subs.filter((s) => s.status === "approved").length;
  const rejectedCount = subs.filter((s) => s.status === "rejected").length;

  // Which post (if any) currently occupies each of the 3 featured slots,
  // used to warn the admin what pinning to that slot will replace.
  const slotOccupants = { 1: null, 2: null, 3: null };
  posts.forEach((p) => {
    if (isActivelyFeatured(p)) slotOccupants[p.featured_slot] = p;
  });

  // Supabase returns plain ISO timestamp strings, not Firestore Timestamp
  // objects — no .toDate() call needed/available here.
  const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={{ fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", color: "white" }}>
      <style>{`
        .adm-row:hover { background: rgba(255,255,255,0.02) !important; }
        .adm-sub-row:hover { background: rgba(255,255,255,0.03) !important; }
        .adm-tab { padding:8px 18px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; white-space:nowrap; }
        .adm-filter { padding:7px 16px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; white-space:nowrap; }
        .adm-hamburger { display:none; }
        .adm-overlay { display:none; }
        .adm-sidebar { transition: transform 220ms ease; }
        .adm-desktop-only { display: flex; }
        .adm-mobile-only { display: none; }
        .adm-main { overflow-x: hidden; }

        @media (max-width: 860px) {
          .adm-stats { grid-template-columns: repeat(3, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .adm-hamburger { display:flex; }
          .adm-sidebar { position:fixed; top:0; left:0; bottom:0; transform: translateX(-100%); z-index:60; }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-overlay.open { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:55; }
          .adm-main { margin-left:0 !important; padding:72px 16px 48px !important; }
          .adm-stats { grid-template-columns: repeat(2, 1fr) !important; gap:10px !important; }
          .adm-scroll-x { overflow-x:auto; -webkit-overflow-scrolling:touch; flex-wrap:nowrap !important; }
          .adm-desktop-only { display: none !important; }
          .adm-mobile-only { display: flex !important; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button
        className="adm-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 50, width: "40px", height: "40px", alignItems: "center", justifyContent: "center", background: "#161616", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", fontSize: "17px", cursor: "pointer" }}
      >
        ☰
      </button>

      <div className={`adm-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside className={`adm-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: "240px", background: "#161616", height: "100vh", padding: "32px 20px", borderRight: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 60, overflowY: "auto" }}>
          <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "40px" }}>
            <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
          </div>
          <nav style={{ flex: 1 }}>
            <NavLink to="/admin"     label="Dashboard"  icon="⊞" active={true}  onClick={() => setSidebarOpen(false)} />
            <NavLink to="/admin/new" label="New Post"   icon="+" active={false} onClick={() => setSidebarOpen(false)} />
            <NavLink to="/"          label="View Site"  icon="↗" active={false} onClick={() => setSidebarOpen(false)} />
          </nav>
          <div style={{ marginBottom: "12px" }}>
            {openCount > 0 && (
              <div style={{ background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "8px", fontSize: "12px", color: "var(--color-red)", fontWeight: 600 }}>
                {openCount} open submission{openCount !== 1 ? "s" : ""} pending
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "10px", padding: "10px", fontFamily: F.b, fontSize: "13px", cursor: "pointer", width: "100%" }}>
            Sign Out
          </button>
        </aside>

        {/* Main */}
        <main className="adm-main" style={{ marginLeft: "240px", flex: 1, padding: "40px", minWidth: 0 }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-red)", marginBottom: "6px" }}>Admin</div>
              <h1 style={{ fontFamily: F.d, fontSize: "1.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Dashboard</h1>
            </div>
            <Link to="/admin/new" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "var(--color-red)", color: "white", padding: "11px 22px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              + New Post
            </Link>
          </div>

          {/* Stats */}
          <div className="adm-stats" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "28px" }}>
            <StatCard label="Total Posts"  val={posts.length} />
            <StatCard label="Published"    val={posts.filter((p) => p.status === "published").length} />
            <StatCard label="Drafts"       val={posts.filter((p) => p.status === "draft").length} />
            <StatCard label="Submissions"  val={subs.length} accent="#4DD9D0" />
            <StatCard label="Open"         val={openCount}     accent="#D94F2B" />
            <StatCard label="Approved"     val={approvedCount} accent="#22c55e" />
            <StatCard label="Rejected"     val={rejectedCount} accent="#ff6b6b" />
          </div>

          {/* Tabs */}
          <div className="adm-scroll-x" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[{ id: "posts", label: "Blog Posts" }, { id: "submissions", label: `Playlist Submissions${openCount > 0 ? ` (${openCount})` : ""}` }].map(({ id, label }) => (
              <button key={id} className="adm-tab" onClick={() => setTab(id)}
                style={{ background: tab === id ? "var(--color-red)" : "transparent", borderColor: tab === id ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: tab === id ? "white" : "rgba(255,255,255,0.5)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── POSTS TAB ── */}
          {tab === "posts" && (
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
                  <button key={value} className="adm-filter" onClick={() => setPostFilter(value)}
                    style={{ background: postFilter === value ? "var(--color-red)" : "transparent", borderColor: postFilter === value ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: postFilter === value ? "white" : "rgba(255,255,255,0.5)" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
                {loadingPosts ? (
                  <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading posts…</div>
                ) : filteredPosts.length === 0 ? (
                  <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No posts found. <Link to="/admin/new" style={{ color: "var(--color-red)" }}>Create one →</Link></div>
                ) : filteredPosts.map((post, i) => (
                  <div key={post.id} className="adm-row" style={{ padding: "16px 24px", borderBottom: i < filteredPosts.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>

                    {/* Desktop: single row + feature control below */}
                    <div className="adm-desktop-only" style={{ flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {post.cover_url
                          ? <img src={post.cover_url} alt="" style={{ width: "60px", height: "60px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: "60px", height: "60px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.d, fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "white", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: "rgba(77,217,208,0.12)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.25)" }}>{post.category}</span>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(post.published_at)}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: post.status === "published" ? "rgba(77,217,208,0.12)" : "rgba(255,255,255,0.06)", color: post.status === "published" ? "var(--color-cyan)" : "rgba(255,255,255,0.35)", border: `0.5px solid ${post.status === "published" ? "rgba(77,217,208,0.25)" : "rgba(255,255,255,0.1)"}`, flexShrink: 0 }}>
                          {post.status}
                        </span>
                        <PostActions post={post} deleting={deleting} togglePublish={togglePublish} deletePost={deletePost} />
                      </div>
                      <FeatureControl post={post} slotOccupants={slotOccupants} isPinning={pinningId === post.id} onPin={pinFeatured} onUnpin={unpinFeatured} />
                    </div>

                    {/* Mobile: stacked card */}
                    <div className="adm-mobile-only" style={{ flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {post.cover_url
                          ? <img src={post.cover_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "9px", objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: "48px", height: "48px", borderRadius: "9px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.d, fontSize: "0.88rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "white", marginBottom: "5px" }}>{post.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "100px", background: "rgba(77,217,208,0.12)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.25)" }}>{post.category}</span>
                            <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(post.published_at)}</span>
                            <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: post.status === "published" ? "rgba(77,217,208,0.12)" : "rgba(255,255,255,0.06)", color: post.status === "published" ? "var(--color-cyan)" : "rgba(255,255,255,0.35)", border: `0.5px solid ${post.status === "published" ? "rgba(77,217,208,0.25)" : "rgba(255,255,255,0.1)"}` }}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <PostActions post={post} deleting={deleting} togglePublish={togglePublish} deletePost={deletePost} stacked />
                      <FeatureControl post={post} slotOccupants={slotOccupants} isPinning={pinningId === post.id} onPin={pinFeatured} onUnpin={unpinFeatured} stacked />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SUBMISSIONS TAB ── */}
          {tab === "submissions" && (
            <>
              <div className="adm-scroll-x" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {SUB_STATUSES.map(({ value, label }) => (
                  <button key={value} className="adm-filter" onClick={() => setSubFilter(value)}
                    style={{ background: subFilter === value ? "var(--color-red)" : "transparent", borderColor: subFilter === value ? "var(--color-red)" : "rgba(255,255,255,0.12)", color: subFilter === value ? "white" : "rgba(255,255,255,0.5)" }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
                {loadingSubs ? (
                  <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading submissions…</div>
                ) : filteredSubs.length === 0 ? (
                  <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No submissions yet.</div>
                ) : filteredSubs.map((sub, i) => {
                  // All submission-form fields live inside the jsonb `payload`
                  // column, not as top-level table columns — see MIGRATION.md
                  // Section 2. Destructure once per row for readability below.
                  const p = sub.payload || {};
                  const statusColor = STATUS_COLOR[sub.status] || STATUS_COLOR.open;
                  const isUpdating = updatingStatus === sub.id;
                  return (
                  <div key={sub.id}>
                    {/* Row */}
                    <div className="adm-sub-row" style={{ padding: "16px 24px", borderBottom: expanded === sub.id || i < filteredSubs.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>

                      {/* Desktop: single row */}
                      <div className="adm-desktop-only" style={{ alignItems: "center", gap: "16px", cursor: "pointer" }} onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "white", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.artistName} — <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{p.trackName}</span>
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(sub.submitted_at)}</span>
                            {p.genre && <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: "rgba(77,217,208,0.1)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.2)" }}>{p.genre}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${statusColor}1a`, color: statusColor, border: `0.5px solid ${statusColor}40`, flexShrink: 0 }}>
                          {sub.status}
                        </span>
                        <SubActions sub={sub} isUpdating={isUpdating} deleting={deleting} updateSubmissionStatus={updateSubmissionStatus} deleteSubmission={deleteSubmission} />
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", transition: "transform 200ms", transform: expanded === sub.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
                      </div>

                      {/* Mobile: stacked card */}
                      <div className="adm-mobile-only" style={{ flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }} onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0, marginTop: "5px" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: F.d, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "white", marginBottom: "5px" }}>
                              {p.artistName} — <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{p.trackName}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(sub.submitted_at)}</span>
                              {p.genre && <span style={{ fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "100px", background: "rgba(77,217,208,0.1)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.2)" }}>{p.genre}</span>}
                              <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: `${statusColor}1a`, color: statusColor, border: `0.5px solid ${statusColor}40` }}>
                                {sub.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", flexShrink: 0, marginTop: "4px", transform: expanded === sub.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
                        </div>
                        <SubActions sub={sub} isUpdating={isUpdating} deleting={deleting} updateSubmissionStatus={updateSubmissionStatus} deleteSubmission={deleteSubmission} stacked />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expanded === sub.id && (
                      <div style={{ padding: "20px 24px 24px 28px", borderBottom: i < filteredSubs.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none", background: "rgba(255,255,255,0.015)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                          {[
                            { label: "Artist",  val: p.artistName },
                            { label: "Track",   val: p.trackName },
                            { label: "Genre",   val: p.genre || "—" },
                            { label: "Email",   val: p.email },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "13px", color: "white", fontWeight: 500, wordBreak: "break-word" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {p.spotifyLink && (
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Spotify Link</div>
                            <a href={p.spotifyLink} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1DB954", textDecoration: "none", fontWeight: 500, wordBreak: "break-all" }}>{p.spotifyLink}</a>
                          </div>
                        )}
                        {p.notes && (
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Notes</div>
                            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{p.notes}</div>
                          </div>
                        )}
                        {p.optionalFollows?.length > 0 && (
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>Also follows</div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {p.optionalFollows.map((f) => (
                                <span key={f} style={{ fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "100px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "0.5px solid rgba(255,255,255,0.1)" }}>{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}