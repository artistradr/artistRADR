import { useEffect } from "react";
import PropTypes from "prop-types";

const SITE_URL = "https://artistradr.com";
const SITE_NAME = "Artist RADR";

/**
 * SEOHead — manages document title, meta tags, and Open Graph / Twitter cards.
 * 
 * This component injects tags into <head> using useEffect, which works for:
 * - Real users (the page title updates in the browser tab)
 * - Social media crawlers that render JavaScript (Twitter, Facebook, LinkedIn)
 * - Google Search (which does render JavaScript)
 * 
 * It does NOT help the OAuth verification crawler (non-JS crawler that only reads
 * static HTML). For that, see public/index.html's <noscript> fallback.
 */
function SEOHead({ 
  title, 
  description, 
  path = "", 
  image = "/og-image.jpg",
  type = "website",
  publishedTime,
  author = SITE_NAME
}) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // OG:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = fullTitle;

    // OG:description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description;

    // OG:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = `${SITE_URL}${path}`;

    // OG:image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement("meta");
      ogImage.setAttribute("property", "og:image");
      document.head.appendChild(ogImage);
    }
    ogImage.content = `${SITE_URL}${image}`;

    // OG:type
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement("meta");
      ogType.setAttribute("property", "og:type");
      document.head.appendChild(ogType);
    }
    ogType.content = type;

    // OG:site_name
    let ogSite = document.querySelector('meta[property="og:site_name"]');
    if (!ogSite) {
      ogSite = document.createElement("meta");
      ogSite.setAttribute("property", "og:site_name");
      document.head.appendChild(ogSite);
    }
    ogSite.content = SITE_NAME;

    // Twitter card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement("meta");
      twitterCard.name = "twitter:card";
      document.head.appendChild(twitterCard);
    }
    twitterCard.content = "summary_large_image";

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement("meta");
      twitterTitle.name = "twitter:title";
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.content = fullTitle;

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement("meta");
      twitterDesc.name = "twitter:description";
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.content = description;

    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement("meta");
      twitterImage.name = "twitter:image";
      document.head.appendChild(twitterImage);
    }
    twitterImage.content = `${SITE_URL}${image}`;

    // Cleanup: restore default tags on unmount
    return () => {
      document.title = SITE_NAME;
      
      const metaDesc2 = document.querySelector('meta[name="description"]');
      if (metaDesc2) metaDesc2.content = "Artist RADR is a music discovery platform spotlighting emerging artists, curated playlists, and fresh sounds from around the world.";

      const ogTitle2 = document.querySelector('meta[property="og:title"]');
      if (ogTitle2) ogTitle2.content = SITE_NAME;

      const ogDesc2 = document.querySelector('meta[property="og:description"]');
      if (ogDesc2) ogDesc2.content = "Artist RADR is a music discovery platform spotlighting emerging artists, curated playlists, and fresh sounds from around the world.";
    };
  }, [fullTitle, description, path, image, type]);

  return null;
}

SEOHead.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  path: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  publishedTime: PropTypes.string,
  author: PropTypes.string,
};

export default SEOHead;