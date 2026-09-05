import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

// Keep this list in sync with:
//  - public.posts_category_check (DB constraint, Supabase project rjivkemajotafjvtalol)
//  - AdminDashboard.jsx's POST_CATEGORIES
//  - BlogPage.jsx's CATEGORIES
const CATEGORIES = [
  { value: "new-release",  label: "New Release" },
  { value: "on-your-radr", label: "On Your RADR" },
  { value: "playlist",     label: "Playlist" },
  { value: "spotlights",   label: "Spotlights" },
  { value: "single",       label: "Single" },
  { value: "album",        label: "Album" },
  { value: "ep",           label: "EP" },
  { value: "news",         label: "News" },
  { value: "updates",      label: "Updates" },
  { value: "trending",     label: "Trending" },
];

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "12px 16px",
  background: "#1C1C1C", border: "0.5px solid rgba(255,255,255,0.1)",
  borderRadius: "10px", color: "white", fontFamily: "var(--font-body)",
  fontSize: "14px", outline: "none",
};

export default function PostEditor() {
  const { id } = useParams(); // undefined = new post
  const { user, userRole, loading, roleLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    category: "on-your-radr", status: "draft",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCover, setExistingCover] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (userRole !== "radrStaff") { navigate("/"); return; }
    if (isEdit) loadPost();
  }, [userRole, loading, roleLoading, id]);

  const loadPost = async () => {
    const { data, error: err } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (err) { setError("Failed to load post: " + err.message); return; }
    if (data) {
      setForm({
        title: data.title || "",
        slug: data.slug || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: data.category || "on-your-radr",
        status: data.status || "draft",
      });
      setExistingCover(data.cover_url || null);
    }
  };

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      ...(name === "title" && !isEdit ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {}),
    }));
  };

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (postId) => {
    if (!coverFile) return existingCover;
    const path = `posts/${postId}/cover`;
    const { error: uploadError } = await supabase.storage
      .from("post-covers")
      .upload(path, coverFile, { upsert: true });
    if (uploadError) throw uploadError;
    setUploadProgress(100);
    const { data } = supabase.storage.from("post-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async (statusOverride) => {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.slug.trim())  { setError("Slug is required."); return; }
    setSaving(true);
    try {
      const finalStatus = statusOverride || form.status;
      const nowISO = new Date().toISOString();

      if (isEdit) {
        const coverUrl = await uploadCover(id);
        const { error: updateError } = await supabase
          .from("posts")
          .update({
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            content: form.content,
            category: form.category,
            status: finalStatus,
            cover_url: coverUrl,
            updated_at: nowISO,
          })
          .eq("id", id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("posts")
          .insert({
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            content: form.content,
            category: form.category,
            status: finalStatus,
            cover_url: null,
            author_id: user?.id ?? null,
            published_at: nowISO,
            updated_at: nowISO,
          })
          .select()
          .single();
        if (insertError) throw insertError;

        const coverUrl = await uploadCover(inserted.id);
        if (coverUrl) {
          const { error: coverUpdateError } = await supabase
            .from("posts")
            .update({ cover_url: coverUrl })
            .eq("id", inserted.id);
          if (coverUpdateError) throw coverUpdateError;
        }
      }
      navigate("/admin");
    } catch (e) {
      setError("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", color: "white" }}>
      <style>{`
        .pe-hamburger { display:none; }
        .pe-overlay { display:none; pointer-events: none; }
        .pe-sidebar { transition: transform 220ms ease; }
        .pe-grid { display:grid; grid-template-columns: 1fr 300px; gap:24px; align-items:start; }
        .pe-actions { display:flex; gap:10px; }
        .pe-actions button { flex: 0 0 auto; }

        @media (max-width: 768px) {
          .pe-hamburger { display:flex; }
          .pe-sidebar { position:fixed !important; transform: translateX(-100%); z-index:65; }
          .pe-sidebar.open { transform: translateX(0); }
          .pe-overlay.open { display:block !important; pointer-events: auto; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:55; }
          .pe-main { margin-left:0 !important; max-width:100% !important; padding:72px 16px 40px !important; }
          .pe-grid { grid-template-columns: 1fr !important; }
          .pe-actions { flex-direction:column; }
          .pe-actions button { width:100%; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button
        className="pe-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 50, width: "40px", height: "40px", alignItems: "center", justifyContent: "center", background: "#161616", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", fontSize: "17px", cursor: "pointer" }}
      >
        ☰
      </button>

      <div className={`pe-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex" }}>

        {/* Sidebar */}
        <aside className={`pe-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: "240px", background: "#161616", height: "100vh", padding: "32px 20px", position: "fixed", top: 0, left: 0, zIndex: 65, borderRight: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "40px" }}>
            <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
          </div>
          <nav style={{ flex: 1 }}>
            {[
              { label: "Dashboard", icon: "⊞", to: "/admin" },
              { label: "New Post",  icon: "+", to: "/admin/new" },
              { label: "View Site", icon: "↗", to: "/" },
            ].map(({ label, icon, to }) => (
              <button
                key={label}
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(to);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  marginBottom: "4px",
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: F.b,
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => e.target.style.color = "white"}
                onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.65)"}
              >
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="pe-main" style={{ marginLeft: "240px", flex: 1, padding: "40px", maxWidth: "900px", minWidth: 0 }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-red)", marginBottom: "6px" }}>Admin</div>
            <h1 style={{ fontFamily: F.d, fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              {isEdit ? "Edit Post" : "New Post"}
            </h1>
          </div>

          {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "0.5px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#ff6b6b", fontSize: "13px", marginBottom: "24px" }}>{error}</div>}

          <div className="pe-grid">

            {/* Left — main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Title *</label>
                <input name="title" value={form.title} onChange={handle} placeholder="Post title…" style={{ ...inputStyle, fontSize: "18px", fontFamily: F.d, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }} />
              </div>

              {/* Post Description */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Post Description</label>
                <textarea name="excerpt" value={form.excerpt} onChange={handle} placeholder="Short description shown in listings…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Blog Content */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Blog Content *</label>
                <textarea name="content" value={form.content} onChange={handle} placeholder="Write your post content here. HTML is supported." rows={18} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>HTML supported — &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;img&gt;, &lt;a&gt;</div>
              </div>
            </div>

            {/* Right — meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Cover image */}
              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Cover Image</div>
                {(coverPreview || existingCover) && (
                  <img src={coverPreview || existingCover} alt="" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px", display: "block" }} />
                )}
                <label style={{ display: "block", padding: "10px", background: "rgba(255,255,255,0.05)", border: "0.5px dashed rgba(255,255,255,0.15)", borderRadius: "10px", textAlign: "center", cursor: "pointer", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                  {coverPreview || existingCover ? "Change image" : "Upload cover image"}
                  <input type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
                </label>
              </div>

              {/* Category */}
              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Category</div>
                {CATEGORIES.map(({ value, label }) => (
                  <label key={value} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${form.category === value ? "var(--color-red)" : "rgba(255,255,255,0.2)"}`, background: form.category === value ? "var(--color-red)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 150ms ease" }}>
                      {form.category === value && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
                    </div>
                    <span style={{ fontSize: "13px", color: form.category === value ? "white" : "rgba(255,255,255,0.55)" }}>{label}</span>
                    <input type="radio" name="category" value={value} checked={form.category === value} onChange={handle} style={{ display: "none" }} />
                  </label>
                ))}
              </div>

              {/* Status */}
              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Status</div>
                <select name="status" value={form.status} onChange={handle} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save / Publish — bottom of form */}
          <div className="pe-actions" style={{ marginTop: "32px", paddingTop: "24px", borderTop: "0.5px solid rgba(255,255,255,0.08)", justifyContent: "flex-end" }}>
            <button onClick={() => save("draft")} disabled={saving} style={{ padding: "13px 24px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontFamily: F.b, fontSize: "13.5px", fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
              Save Draft
            </button>
            <button onClick={() => save("published")} disabled={saving} style={{ padding: "13px 24px", borderRadius: "10px", background: "var(--color-red)", border: "none", color: "white", fontFamily: F.b, fontSize: "13.5px", fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 16px rgba(217,79,43,0.3)" }}>
              {saving ? `Saving${uploadProgress > 0 ? ` ${uploadProgress}%` : "…"}` : "Publish"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}