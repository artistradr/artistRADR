import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";
import { ADMIN_BASE } from "./adminBase";
import { sanitizeArticleHtml } from "../../utils/sanitizeHtml";

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

const toolbarBtnStyle = {
  padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)",
  border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)",
  fontFamily: "var(--font-body)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
  whiteSpace: "nowrap", lineHeight: 1,
};

const toolbarBtnActiveStyle = {
  ...toolbarBtnStyle,
  background: "rgba(77,217,208,0.14)",
  border: "0.5px solid rgba(77,217,208,0.35)",
  color: "var(--color-cyan)",
};

// ── Draft autosave (sessionStorage) ─────────────────────────────────────────
const DRAFT_STORAGE_KEY = "radr_post_draft";

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft) {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {}
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {}
}

function extractSpotifyEmbedSrc(url) {
  const m = url.match(/open\.spotify\.com\/(track|album|artist|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
}

function extractYoutubeEmbedSrc(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Escapes text for use in HTML text AND double-quoted attribute values.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only plain web / mail links may be inserted. Blocks javascript:, data:, etc.
function safeLinkUrl(raw) {
  try {
    const u = new URL(raw.trim());
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Converts any uploaded cover image to JPEG before it's stored.
//
// Why: browsers/screenshot tools/exporters can hand us WebP (or other
// formats), and Facebook's/X's link-preview crawlers do NOT reliably
// support WebP for og:image/twitter:image even though it displays fine
// on the live site itself. A post's cover can look completely correct
// everywhere except in a shared link preview, where the image silently
// fails to render. Normalizing every upload to JPEG here means that can
// never happen again for new posts.
function convertImageFileToJpeg(file, { quality = 0.85, maxWidth = 1600 } = {}) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // Flatten onto white first — JPEG has no alpha channel, so any
      // transparent PNG/WebP source would otherwise turn black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          const jpegName = file.name.replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], jpegName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image failed to load for conversion"));
    };
    img.src = objectUrl;
  });
}

// Defensive pass: pulls any block-level element (p, ul, ol, blockquote,
// figure, or another heading) that ended up NESTED inside a heading back
// out as a top-level sibling right after that heading.
//
// Why this matters: text-transform is an inherited CSS property, and
// headings are styled uppercase. If a <p> ever ends up as a *child* of an
// <h1-6> (which browsers can do when content is inserted while the caret
// sits inside an empty heading — see the placeholder-escape logic in
// insertHtmlBlock below), that <p> visually inherits the heading's
// uppercase styling even though the <p> itself has no such rule. This
// pass guarantees that can never survive into a saved post, regardless
// of which browser/quirk produced the nesting.
function unnestBlocksFromHeadings(container) {
  const BLOCK_TAGS = new Set(["FIGURE", "H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "BLOCKQUOTE"]);
  let changed = true;
  while (changed) {
    changed = false;
    const headings = container.querySelectorAll("h1,h2,h3,h4,h5,h6");
    for (const h of headings) {
      const nestedBlocks = Array.from(h.children).filter((c) => BLOCK_TAGS.has(c.tagName));
      if (nestedBlocks.length) {
        nestedBlocks.forEach((block) => {
          h.parentNode.insertBefore(block, h.nextSibling);
        });
        changed = true;
      }
    }
  }
}

// Normalizes editor output to match the WordPress-migrated posts' block
// structure. This does three jobs:
//
// 1. Assigns wp-block-* classes to real h1-h6/p/ul elements that don't
//    already carry one.
// 2. Rebuilds the top level of the document when it's NOT made of proper
//    block elements at all — i.e. when staff typed or pasted directly
//    into the editor and the browser produced bare text nodes or <div>
//    line-breaks instead of <p> tags (Chrome's contentEditable default).
//    Every top-level child is walked: real blocks (p, h1-h6, ul, ol,
//    blockquote, figure) are kept as-is; <div> wrappers and bare
//    text/inline nodes are converted into <p class="wp-block-paragraph">.
// 3. (NEW) Un-nests any block element that ended up trapped inside a
//    heading (see unnestBlocksFromHeadings above) so saved posts can
//    never carry an inherited-uppercase bug onto the live blog page.
function normalizeToWp(html) {
  const container = document.createElement("div");
  // Sanitize first: even a detached element runs <img onerror> handlers
  // as soon as innerHTML is assigned.
  container.innerHTML = sanitizeArticleHtml(html);

  const BLOCK_TAGS = new Set(["FIGURE", "H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "BLOCKQUOTE"]);
  const rebuilt = [];

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(node.tagName)) {
      rebuilt.push(node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "DIV") {
      const inner = node.innerHTML.trim();
      if (!inner || inner === "<br>") return; // empty spacer div — drop it
      const p = document.createElement("p");
      p.className = "wp-block-paragraph";
      p.innerHTML = node.innerHTML;
      rebuilt.push(p);
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text.trim()) return;
      // Bare top-level text can contain literal newlines from typed
      // content — treat blank-line gaps as paragraph breaks.
      text.split(/\n{2,}/).forEach((chunk) => {
        const trimmed = chunk.trim();
        if (!trimmed) return;
        const p = document.createElement("p");
        p.className = "wp-block-paragraph";
        p.textContent = trimmed;
        rebuilt.push(p);
      });
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Any other stray inline element (br, span, a, etc.) sitting at the
      // top level — wrap it so it isn't silently lost.
      const p = document.createElement("p");
      p.className = "wp-block-paragraph";
      p.appendChild(node.cloneNode(true));
      rebuilt.push(p);
    }
  });

  container.innerHTML = "";
  rebuilt.forEach((n) => container.appendChild(n));

  // Un-nest before class assignment so classes land on the correct,
  // now-top-level elements.
  unnestBlocksFromHeadings(container);

  container.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
    if (!h.className) h.className = "wp-block-heading";
  });
  container.querySelectorAll("p").forEach((p) => {
    if (!p.className) p.className = "wp-block-paragraph";
  });
  container.querySelectorAll("ul").forEach((ul) => {
    if (!ul.className) ul.className = "wp-block-list";
  });

  // Drop a leading empty seeded heading if it was never filled in.
  const first = container.firstElementChild;
  if (
    first &&
    first.tagName === "H3" &&
    first.classList.contains("wp-block-heading") &&
    !first.textContent.trim()
  ) {
    container.removeChild(first);
  }

  return container.innerHTML.trim();
}

export default function PostEditor({ embedded = false }) {
  const { id } = useParams(); // undefined = new post
  const { user, userRole, loading, roleLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "",
    category: "on-your-radr", status: "draft",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCover, setExistingCover] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeTool, setActiveTool] = useState(null);
  const [headingText, setHeadingText] = useState("");
  const [paragraphText, setParagraphText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");

  const editorRef = useRef(null);
  const lastRangeRef = useRef(null);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (userRole !== "radrStaff") { navigate("/"); return; }
    if (isEdit) loadPost();
  }, [userRole, loading, roleLoading, id]);

  // Forces the browser's contentEditable to create <p> on Enter instead of
  // its Chrome default of <div>. This is the root-cause fix for posts
  // saving with no paragraph/heading structure at all when staff typed
  // straight into the editor instead of using the toolbar buttons.
  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {}
  }, []);

  useEffect(() => {
    if (isEdit) return;
    const draft = readDraft();
    if (!draft) return;
    if (!window.confirm("You have an unsaved draft from a previous session. Restore it?")) {
      clearDraft();
      return;
    }
    setForm((p) => ({ ...p, ...draft.form }));
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = sanitizeArticleHtml(draft.contentHtml || "");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEdit) return;
    if (readDraft()) return;
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el || el.innerHTML.trim()) return;
      el.innerHTML = '<h3 class="wp-block-heading"><br></h3>';
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el.firstChild);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      el.focus();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      if (!editorRef.current) return;
      const contentHtml = editorRef.current.innerHTML;
      const isEmpty = !form.title.trim() && !contentHtml.replace(/<[^>]*>/g, "").trim();
      if (isEmpty) return;
      writeDraft({ form, contentHtml, savedAt: Date.now() });
      setHasUnsavedChanges(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [form]);

  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

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
        category: data.category || "on-your-radr",
        status: data.status || "draft",
      });
      setExistingCover(data.cover_url || null);
      // Sanitize before it touches the DOM so a poisoned post can't run
      // script inside a staff session just by being opened for editing.
      if (editorRef.current) editorRef.current.innerHTML = sanitizeArticleHtml(data.content || "");
    }
  };

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      ...(name === "title" && !isEdit ? { slug: slugify(value) } : {}),
    }));
    setHasUnsavedChanges(true);
  };

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      lastRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const openTool = (tool) => {
    rememberSelection();
    setActiveTool((t) => (t === tool ? null : tool));
  };

  const closeTool = () => {
    setActiveTool(null);
    setHeadingText("");
    setParagraphText("");
    setLinkText("");
    setLinkUrl("");
    setEmbedUrl("");
  };

  // Walks up from a node to find an ancestor heading (h1-h6) within the
  // editor, if any.
  const findHeadingAncestor = (node) => {
    let cursor = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (cursor && cursor !== editorRef.current) {
      if (/^H[1-6]$/.test(cursor.tagName)) return cursor;
      cursor = cursor.parentElement;
    }
    return null;
  };

  const insertHtmlBlock = (html) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();

    let range = lastRangeRef.current ? lastRangeRef.current.cloneRange() : null;

    // BUGFIX: if the caret is still sitting inside the empty placeholder
    // heading (the seeded "<h3 class='wp-block-heading'><br></h3>" used
    // for the post's opening line), document.execCommand('insertHTML')
    // can insert the new block(s) AS CHILDREN of that heading instead of
    // splitting out of it. Because text-transform is an inherited CSS
    // property and headings are styled uppercase, any paragraph nested
    // this way visually renders in caps even though the <p> itself has
    // no uppercase rule — this was the cause of pasted content
    // "turning uppercase". Detect that case and drop the (still-empty)
    // placeholder heading first, so new content always lands as a
    // sibling at the editor's top level, never as its child.
    if (range) {
      const headingAncestor = findHeadingAncestor(range.startContainer);
      if (headingAncestor) {
        const isEmpty = headingAncestor.textContent.replace(/\u200B/g, "").trim() === "";
        if (isEmpty) {
          const after = document.createRange();
          after.setStartAfter(headingAncestor);
          after.collapse(true);
          headingAncestor.remove();
          range = after;
        }
      }
    }

    if (range) {
      sel.addRange(range);
    } else {
      const fallback = document.createRange();
      fallback.selectNodeContents(el);
      fallback.collapse(false);
      sel.addRange(fallback);
    }

    document.execCommand("insertHTML", false, html);
    rememberSelection();
    setHasUnsavedChanges(true);
  };

  const applyFormat = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setHasUnsavedChanges(true);
  };

  const insertHeading = () => {
    if (!headingText.trim()) return;
    insertHtmlBlock(`<h3 class="wp-block-heading">${escapeHtml(headingText.trim())}</h3>`);
    closeTool();
  };

  const insertParagraph = () => {
    if (!paragraphText.trim()) return;
    insertHtmlBlock(`<p class="wp-block-paragraph">${escapeHtml(paragraphText.trim())}</p>`);
    closeTool();
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const href = safeLinkUrl(linkUrl);
    if (!href) {
      window.alert("Links must start with http://, https:// or mailto:");
      return;
    }
    const label = linkText.trim() || linkUrl.trim();
    insertHtmlBlock(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    closeTool();
  };

  const insertEmbed = (kind) => {
    const src = kind === "spotify" ? extractSpotifyEmbedSrc(embedUrl.trim()) : extractYoutubeEmbedSrc(embedUrl.trim());
    if (!src) {
      window.alert(`Couldn't read that as a ${kind === "spotify" ? "Spotify track/album/artist/playlist" : "YouTube video"} link.`);
      return;
    }
    const html = kind === "spotify"
      ? `<figure class="wp-block-embed is-type-rich is-provider-spotify wp-block-embed-spotify wp-embed-aspect-21-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper"><iframe title="Spotify Embed" style="border-radius:12px" src="${src}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div></figure><p class="wp-block-paragraph"><br></p>`
      : `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper"><iframe title="YouTube video player" src="${src}" width="750" height="422" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></figure><p class="wp-block-paragraph"><br></p>`;
    insertHtmlBlock(html);
    closeTool();
  };

  // Intercepts paste so pasted content (Docs, ChatGPT, another site) can't
  // inject its own <div>/<span style>/<meta> junk. Strips to plain text and
  // wraps each blank-line-separated chunk into a real <p class=
  // "wp-block-paragraph">, matching what typing + Enter now produces.
  const handlePaste = (e) => {
    e.preventDefault();
    rememberSelection();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    if (!text) return;
    const html = text
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => `<p class="wp-block-paragraph">${escapeHtml(chunk)}</p>`)
      .join("");
    insertHtmlBlock(html);
  };

  const handleCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const jpegFile = await convertImageFileToJpeg(file);
      setCoverFile(jpegFile);
      setCoverPreview(URL.createObjectURL(jpegFile));
    } catch (err) {
      // If conversion fails for any reason, fall back to the original
      // file rather than blocking the upload entirely.
      console.error("Cover image conversion to JPEG failed, using original file:", err);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
    setHasUnsavedChanges(true);
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
    return `${data.publicUrl}?v=${Date.now()}`;
  };

  const save = async (statusOverride) => {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    const cleanSlug = slugify(form.slug);
    if (!cleanSlug) { setError("Slug is required (letters, numbers and hyphens only)."); return; }
    setSaving(true);
    try {
      const finalStatus = statusOverride || form.status;
      const nowISO = new Date().toISOString();
      const normalizedContent = normalizeToWp(editorRef.current?.innerHTML || "");

      if (isEdit) {
        const coverUrl = await uploadCover(id);
        const { error: updateError } = await supabase
          .from("posts")
          .update({
            title: form.title,
            slug: cleanSlug,
            excerpt: form.excerpt,
            content: normalizedContent,
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
            slug: cleanSlug,
            excerpt: form.excerpt,
            content: normalizedContent,
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
      clearDraft();
      setHasUnsavedChanges(false);
      navigate(ADMIN_BASE);
    } catch (e) {
      setError("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={embedded ? { fontFamily: F.b, color: "white" } : { fontFamily: F.b, background: "#0E0E0E", minHeight: "100vh", color: "white" }}>
      <style>{`
        .pe-hamburger { display:none; }
        .pe-overlay { display:none; pointer-events: none; }
        .pe-sidebar { transition: transform 220ms ease; }
        .pe-grid { display:grid; grid-template-columns: 1fr 300px; gap:24px; align-items:start; }
        .pe-actions { display:flex; gap:10px; }
        .pe-actions button { flex: 0 0 auto; }
        .pe-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:0; padding:10px; background:#1C1C1C; border:0.5px solid rgba(255,255,255,0.1); border-bottom:none; border-radius:10px 10px 0 0; }
        .pe-tool-box { display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:12px; background:#161616; border:0.5px solid rgba(255,255,255,0.1); border-top:none; }
        .pe-editor { min-height:420px; padding:16px; background:#1C1C1C; border:0.5px solid rgba(255,255,255,0.1); border-radius:0 0 10px 10px; color:white; font-size:14px; line-height:1.7; outline:none; }
        .pe-editor:empty:before { content: attr(data-placeholder); color: rgba(255,255,255,0.3); }
        .pe-editor h3 { font-family: var(--font-display); font-weight:800; text-transform:uppercase; letter-spacing:0.5px; font-size:1.15rem; margin: 18px 0 10px; }
        .pe-editor p { margin: 0 0 14px; }
        .pe-editor ul { margin: 0 0 14px; padding-left: 22px; }
        .pe-editor a { color: var(--color-cyan); }
        .pe-editor figure { margin: 18px 0; }
        .pe-editor iframe { max-width: 100%; }
        /* Safety net: even if a paragraph/list/link ever ends up nested
           inside a heading (browser paste quirks etc.), explicitly reset
           text-transform so it can never visually inherit the heading's
           uppercase styling. */
        .pe-editor p, .pe-editor li, .pe-editor a, .pe-editor span, .pe-editor blockquote {
          text-transform: none;
        }

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

      {!embedded && (<>
      <button
        className="pe-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 50, width: "40px", height: "40px", alignItems: "center", justifyContent: "center", background: "#161616", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", fontSize: "17px", cursor: "pointer" }}
      >
        ☰
      </button>

      <div className={`pe-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
      </>)}

      <div style={{ display: "flex" }}>

        {!embedded && (
        <aside className={`pe-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: "240px", background: "#161616", height: "100vh", padding: "32px 20px", position: "fixed", top: 0, left: 0, zIndex: 65, borderRight: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ fontFamily: F.d, fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "40px" }}>
            <span style={{ fontStyle: "italic", color: "var(--color-red)" }}>Artist</span> RADR
          </div>
          <nav style={{ flex: 1 }}>
            {[
              { label: "Dashboard", icon: "⊞", to: ADMIN_BASE },
              { label: "New Post",  icon: "+", to: `${ADMIN_BASE}/new` },
              { label: "View Site", icon: "↗", to: "/" },
            ].map(({ label, icon, to }) => (
              <button
                key={label}
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(to);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
                  borderRadius: "10px", marginBottom: "4px", textDecoration: "none",
                  color: "rgba(255,255,255,0.65)", fontSize: "13.5px", fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer", width: "100%",
                  textAlign: "left", fontFamily: F.b, transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => e.target.style.color = "white"}
                onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.65)"}
              >
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
        </aside>
        )}

        <main className={embedded ? "pe-main-embedded" : "pe-main"} style={embedded ? { flex: 1, maxWidth: "900px", minWidth: 0 } : { marginLeft: "240px", flex: 1, padding: "40px", maxWidth: "900px", minWidth: 0 }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-red)", marginBottom: "6px" }}>{embedded ? "Magazine" : "Admin"}</div>
            <h1 style={{ fontFamily: F.d, fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              {isEdit ? "Edit Post" : "New Post"}
            </h1>
          </div>

          {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "0.5px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#ff6b6b", fontSize: "13px", marginBottom: "24px" }}>{error}</div>}

          <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Cover Image</div>
            {(coverPreview || existingCover) && (
              <img src={coverPreview || existingCover} alt="" style={{ width: "100%", maxHeight: "320px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px", display: "block" }} />
            )}
            <label style={{ display: "block", padding: "14px", background: "rgba(255,255,255,0.05)", border: "0.5px dashed rgba(255,255,255,0.15)", borderRadius: "10px", textAlign: "center", cursor: "pointer", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              {coverPreview || existingCover ? "Change image" : "Upload cover image"}
              <input type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
            </label>
          </div>

          <div className="pe-grid">

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Title *  <span style={{ color: "rgba(255,255,255,0.25)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— shown in listings and metadata</span></label>
                <input name="title" value={form.title} onChange={handle} placeholder="Post title…" style={{ ...inputStyle, fontSize: "18px", fontFamily: F.d, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Post Description</label>
                <textarea name="excerpt" value={form.excerpt} onChange={handle} placeholder="Short description shown in listings…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Blog Content *</label>

                <div className="pe-toolbar">
                  <button type="button" onClick={() => applyFormat("bold")} style={{ ...toolbarBtnStyle, fontWeight: 800 }}>B</button>
                  <button type="button" onClick={() => applyFormat("italic")} style={{ ...toolbarBtnStyle, fontStyle: "italic" }}>I</button>
                  <button type="button" onClick={() => applyFormat("insertUnorderedList")} style={toolbarBtnStyle}>• List</button>
                  <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.12)" }} />
                  <button type="button" onClick={() => openTool("heading")} style={activeTool === "heading" ? toolbarBtnActiveStyle : toolbarBtnStyle}>+ Heading</button>
                  <button type="button" onClick={() => openTool("paragraph")} style={activeTool === "paragraph" ? toolbarBtnActiveStyle : toolbarBtnStyle}>+ Paragraph</button>
                  <button type="button" onClick={() => openTool("link")} style={activeTool === "link" ? toolbarBtnActiveStyle : toolbarBtnStyle}>+ Link</button>
                  <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.12)" }} />
                  <button type="button" onClick={() => openTool("spotify")} style={activeTool === "spotify" ? toolbarBtnActiveStyle : toolbarBtnStyle}>Spotify</button>
                  <button type="button" onClick={() => openTool("youtube")} style={activeTool === "youtube" ? toolbarBtnActiveStyle : toolbarBtnStyle}>YouTube</button>
                </div>

                {activeTool === "heading" && (
                  <div className="pe-tool-box">
                    <input autoFocus value={headingText} onChange={(e) => setHeadingText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && insertHeading()} placeholder="Subheading text — an in-body heading, separate from the post Title above" style={{ ...inputStyle, fontSize: "13px" }} />
                    <button type="button" onClick={insertHeading} style={toolbarBtnStyle}>Insert</button>
                    <button type="button" onClick={closeTool} style={{ ...toolbarBtnStyle, background: "none", border: "none", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                  </div>
                )}

                {activeTool === "paragraph" && (
                  <div className="pe-tool-box">
                    <textarea autoFocus value={paragraphText} onChange={(e) => setParagraphText(e.target.value)} placeholder="Paragraph text…" rows={3} style={{ ...inputStyle, fontSize: "13px", resize: "vertical", flex: "1 1 100%" }} />
                    <button type="button" onClick={insertParagraph} style={toolbarBtnStyle}>Insert</button>
                    <button type="button" onClick={closeTool} style={{ ...toolbarBtnStyle, background: "none", border: "none", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                  </div>
                )}

                {activeTool === "link" && (
                  <div className="pe-tool-box">
                    <input autoFocus value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional — defaults to the URL)" style={{ ...inputStyle, fontSize: "13px", flex: "1 1 220px" }} />
                    <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && insertLink()} placeholder="https://…" style={{ ...inputStyle, fontSize: "13px", flex: "1 1 220px" }} />
                    <button type="button" onClick={insertLink} style={toolbarBtnStyle}>Insert</button>
                    <button type="button" onClick={closeTool} style={{ ...toolbarBtnStyle, background: "none", border: "none", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                  </div>
                )}

                {activeTool === "spotify" && (
                  <div className="pe-tool-box">
                    <input autoFocus value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && insertEmbed("spotify")} placeholder="Paste Spotify track/album/artist/playlist link…" style={{ ...inputStyle, fontSize: "13px" }} />
                    <button type="button" onClick={() => insertEmbed("spotify")} style={toolbarBtnStyle}>Insert</button>
                    <button type="button" onClick={closeTool} style={{ ...toolbarBtnStyle, background: "none", border: "none", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                  </div>
                )}

                {activeTool === "youtube" && (
                  <div className="pe-tool-box">
                    <input autoFocus value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && insertEmbed("youtube")} placeholder="Paste YouTube video link…" style={{ ...inputStyle, fontSize: "13px" }} />
                    <button type="button" onClick={() => insertEmbed("youtube")} style={toolbarBtnStyle}>Insert</button>
                    <button type="button" onClick={closeTool} style={{ ...toolbarBtnStyle, background: "none", border: "none", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                  </div>
                )}

                <div
                  ref={editorRef}
                  className="pe-editor"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => setHasUnsavedChanges(true)}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onPaste={handlePaste}
                  data-placeholder="Write your post here…"
                />

                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>
                  Starts with an empty headline — type your opening line there, then write the rest below. Pasted text is auto-formatted into paragraphs. Your draft autosaves locally every few seconds.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

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

              <div style={{ background: "#161616", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>Status</div>
                <select name="status" value={form.status} onChange={handle} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

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
