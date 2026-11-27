import DOMPurify from "dompurify";

// Hosts we allow blog posts to embed via <iframe>. Anything else is dropped.
const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "open.spotify.com",
  "w.soundcloud.com",
  "player.vimeo.com",
  "bandcamp.com",
];

const isAllowedIframeSrc = (src) => {
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol !== "https:") return false;
    return ALLOWED_IFRAME_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "IFRAME" && !isAllowedIframeSrc(node.getAttribute("src") || "")) {
    node.remove();
    return;
  }
  // Links that open a new tab must not hand the new page a reference to ours.
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const ARTICLE_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "target"],
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "object", "embed"],
  FORBID_ATTR: ["style"],
};

const TITLE_CONFIG = {
  ALLOWED_TAGS: ["em", "strong", "i", "b", "span", "br"],
  ALLOWED_ATTR: [],
};

/** Sanitize full article HTML (post.content) before rendering it. */
export const sanitizeArticleHtml = (html = "") => DOMPurify.sanitize(String(html ?? ""), ARTICLE_CONFIG);

/** Sanitize titles/excerpts: inline formatting and entities only. */
export const sanitizeTitleHtml = (html = "") => DOMPurify.sanitize(String(html ?? ""), TITLE_CONFIG);
