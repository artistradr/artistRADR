import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

const POST_CATEGORIES = [
  { value: "all", label: "All Posts" },
  { value: "new-release", label: "New Release" },
  { value: "on-your-radr", label: "On Your RADR" },
  { value: "playlist", label: "Playlist" },
  { value: "spotlights", label: "Spotlights" },
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

function NavLink({ to, label, icon, active }) {
  return (
    <Link to={to} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", marginBottom: "4px", textDecoration: "none", color: active ? "white" : "rgba(255,255,255,0.55)", fontFamily: F.b, fontSize: "13.5px", fontWeight: 500, background: active ? "rgba(217,79,43,0.15)" : "transparent", transition: "background 150ms" }}>
      <span style={{ fontSize: "15px" }}>{icon}</span>{label}
    </Link>
  );
}

function StatCard({ label, val, accent }) {
  return (
    <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px" }}>
      <div style={{ fontFamily: F.d, fontSize: "2rem", fontWeight: 800, color: accent || "var(--color-red)", lineHeight: 1, marginBottom: "4px" }}>{val}</div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{label}</div>
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
  const [expanded, setExpanded]         = useState(null);   // expanded submission id

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

  // Supabase returns plain ISO timestamp strings, not Firestore Timestamp
  // objects — no .toDate() call needed/available here.
  const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={{ fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", color: "white" }}>
      <style>{`
        .adm-row:hover { background: rgba(255,255,255,0.02) !important; }
        .adm-sub-row { cursor:pointer; transition:background 150ms; }
        .adm-sub-row:hover { background: rgba(255,255,255,0.03) !important; }
        .adm-tab { padding:8px 18px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; transition:all 150ms; }
        .adm-filter { padding:7px 16px; border-radius:100px; font-family:var(--font-body); font-size:12px; font-weight:600; border:0.5px solid; cursor:pointer; transition:all 150ms; }
      `}</style>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: "240px", background: "#161616", minHeight: "100vh", padding: "32px 20px", position: "fixed", top: 0, left: 0, borderRight: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "40px" }}>
            <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
          </div>
          <nav style={{ flex: 1 }}>
            <NavLink to="/admin"     label="Dashboard"  icon="⊞" active={true} />
            <NavLink to="/admin/new" label="New Post"   icon="+" active={false} />
            <NavLink to="/"          label="View Site"  icon="↗" active={false} />
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
        <main style={{ marginLeft: "240px", flex: 1, padding: "40px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-red)", marginBottom: "6px" }}>Admin</div>
              <h1 style={{ fontFamily: F.d, fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Dashboard</h1>
            </div>
            <Link to="/admin/new" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "var(--color-red)", color: "white", padding: "11px 22px", borderRadius: "10px", fontFamily: F.b, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              + New Post
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "32px" }}>
            <StatCard label="Total Posts"  val={posts.length} />
            <StatCard label="Published"    val={posts.filter((p) => p.status === "published").length} />
            <StatCard label="Drafts"       val={posts.filter((p) => p.status === "draft").length} />
            <StatCard label="Submissions"  val={subs.length} accent="#4DD9D0" />
            <StatCard label="Open"         val={openCount}     accent="#D94F2B" />
            <StatCard label="Approved"     val={approvedCount} accent="#22c55e" />
            <StatCard label="Rejected"     val={rejectedCount} accent="#ff6b6b" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
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
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
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
                  <div key={post.id} className="adm-row" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 24px", borderBottom: i < filteredPosts.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
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
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <Link to={`/admin/edit/${post.id}`} style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>Edit</Link>
                      <button onClick={() => togglePublish(post)} style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(217,79,43,0.1)", border: "0.5px solid rgba(217,79,43,0.25)", color: "var(--color-red)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => deletePost(post.id)} disabled={deleting === post.id} style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(255,50,50,0.08)", border: "0.5px solid rgba(255,50,50,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: deleting === post.id ? 0.5 : 1 }}>
                        {deleting === post.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SUBMISSIONS TAB ── */}
          {tab === "submissions" && (
            <>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
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
                    <div className="adm-sub-row" onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 24px", borderBottom: expanded === sub.id || i < filteredSubs.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>

                      {/* Status dot */}
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.d, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "white", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.artistName} — <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{p.trackName}</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(sub.submitted_at)}</span>
                          {p.genre && <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: "rgba(77,217,208,0.1)", color: "var(--color-cyan)", border: "0.5px solid rgba(77,217,208,0.2)" }}>{p.genre}</span>}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: "100px", background: `${statusColor}1a`, color: statusColor, border: `0.5px solid ${statusColor}40`, flexShrink: 0 }}>
                        {sub.status}
                      </span>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {sub.status === "open" ? (
                          <>
                            <button onClick={() => updateSubmissionStatus(sub.id, "approved")} disabled={isUpdating}
                              style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.25)", color: "#22c55e", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
                              {isUpdating ? "…" : "Approve"}
                            </button>
                            <button onClick={() => updateSubmissionStatus(sub.id, "rejected")} disabled={isUpdating}
                              style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(255,80,80,0.08)", border: "0.5px solid rgba(255,80,80,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
                              {isUpdating ? "…" : "Reject"}
                            </button>
                          </>
                        ) : (
                          <button onClick={() => updateSubmissionStatus(sub.id, "open")} disabled={isUpdating}
                            title="Revert to open — does not send another email"
                            style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.5 : 1 }}>
                            {isUpdating ? "…" : "Reopen"}
                          </button>
                        )}
                        <button onClick={() => deleteSubmission(sub.id)} disabled={deleting === sub.id}
                          style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(255,50,50,0.08)", border: "0.5px solid rgba(255,50,50,0.2)", color: "#ff6b6b", fontFamily: F.b, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: deleting === sub.id ? 0.5 : 1 }}>
                          {deleting === sub.id ? "…" : "Delete"}
                        </button>
                      </div>

                      {/* Expand arrow */}
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", transition: "transform 200ms", transform: expanded === sub.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
                    </div>

                    {/* Expanded detail */}
                    {expanded === sub.id && (
                      <div style={{ padding: "20px 24px 24px 48px", borderBottom: i < filteredSubs.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none", background: "rgba(255,255,255,0.015)", animation: "fadeIn 150ms ease" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px", marginBottom: "16px" }}>
                          {[
                            { label: "Artist",  val: p.artistName },
                            { label: "Track",   val: p.trackName },
                            { label: "Genre",   val: p.genre || "—" },
                            { label: "Email",   val: p.email },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "13px", color: "white", fontWeight: 500 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {p.spotifyLink && (
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Spotify Link</div>
                            <a href={p.spotifyLink} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1DB954", textDecoration: "none", fontWeight: 500 }}>{p.spotifyLink}</a>
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
                            <div style={{ display: "flex", gap: "6px" }}>
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
        </main>
      </div>
    </div>
  );
}