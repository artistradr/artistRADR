// src/utils/sanitizeHtml.js
//
// Allow-list HTML sanitizer for content that comes from the database (blog post titles and
// bodies) and is rendered with dangerouslySetInnerHTML. No dependencies.
//
// How it works: the HTML is parsed into an inert document (scripts never run and images never
// load while parsing), then only known-safe tags and attributes are kept. Everything else is
// dropped or unwrapped. Links may only use http, https, mailto and tel. Embeds (iframes) are
// kept only for a short list of music/video hosts.
//
// Usage:
//   <div dangerouslySetInnerHTML={safeHtml(post.content)} />
//   <h1 dangerouslySetInnerHTML={safeHtml(post.title, { inline: true })} />

const INLINE_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "sub", "sup", "br", "span", "mark", "small"]);

const RICH_TAGS = new Set([
  ...INLINE_TAGS,
  "p", "div", "a", "ul", "ol", "li", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "figure", "figcaption", "hr", "code", "pre",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "iframe",
]);

// Removed together with everything inside them.
const DROP_TAGS = new Set([
  "script", "style", "object", "embed", "applet", "form", "input", "button", "textarea", "select",
  "svg", "math", "template", "noscript", "link", "meta", "base", "frame", "frameset", "title", "head",
]);

const GLOBAL_ATTRS = new Set(["class", "title", "dir", "lang"]);
const TAG_ATTRS = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  iframe: ["src", "width", "height", "allowfullscreen", "loading", "frameborder"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  ol: ["start"],
};
const URL_ATTRS = new Set(["href", "src"]);
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
const EMBED_HOSTS = new Set([
  "open.spotify.com",
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "w.soundcloud.com",
  "embed.music.apple.com",
  "bandcamp.com",
]);

function isSafeUrl(value) {
  // Browsers ignore control characters and spaces inside a scheme ("java\tscript:"), so strip them first.
  const v = String(value).replace(/[\u0000- \u007f-\u009f]/g, "");
  if (!v) return false;
  const scheme = v.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return true; // relative link
  return SAFE_SCHEMES.has(scheme[0].toLowerCase());
}

function isSafeEmbed(value) {
  try {
    const u = new URL(String(value).trim(), "https://artistradr.com");
    return u.protocol === "https:" && EMBED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

function clean(parent, allowedTags) {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === 3) continue; // text
    if (node.nodeType !== 1) {
      node.remove(); // comments, processing instructions
      continue;
    }

    const tag = node.tagName.toLowerCase();

    if (DROP_TAGS.has(tag)) {
      node.remove();
      continue;
    }

    if (!allowedTags.has(tag)) {
      // Unknown tag: keep its (cleaned) contents, lose the tag itself.
      clean(node, allowedTags);
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      node.remove();
      continue;
    }

    if (tag === "iframe" && !isSafeEmbed(node.getAttribute("src") || "")) {
      node.remove();
      continue;
    }

    const perTag = TAG_ATTRS[tag] || [];
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      if (!GLOBAL_ATTRS.has(name) && !perTag.includes(name)) {
        node.removeAttribute(attr.name);
        continue;
      }
      if (URL_ATTRS.has(name) && tag !== "iframe" && !isSafeUrl(attr.value)) {
        node.removeAttribute(attr.name);
      }
    }

    if (tag === "a") {
      if (node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      } else {
        node.removeAttribute("target");
      }
    }
    if (tag === "iframe") {
      node.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-presentation");
      node.setAttribute("referrerpolicy", "no-referrer");
    }

    clean(node, allowedTags);
  }
}

export function sanitizeHtml(html, { inline = false } = {}) {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return ""; // never render unsanitized HTML without a parser
  const doc = new DOMParser().parseFromString(`<body>${String(html)}`, "text/html");
  clean(doc.body, inline ? INLINE_TAGS : RICH_TAGS);
  return doc.body.innerHTML;
}

// Shape React wants for dangerouslySetInnerHTML.
export const safeHtml = (html, options) => ({ __html: sanitizeHtml(html, options) });
