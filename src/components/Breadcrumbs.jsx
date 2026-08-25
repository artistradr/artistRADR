import { useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const SITE_URL = "https://artistradr.com";

function setJsonLd(id, data) {
  let el = document.head.querySelector(`script[data-jsonld-id="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-jsonld-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  const el = document.head.querySelector(`script[data-jsonld-id="${id}"]`);
  if (el) el.remove();
}

function Breadcrumbs({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        item: `${SITE_URL}${item.path}`,
      })),
    };
    setJsonLd("breadcrumbs", jsonLd);

    return () => removeJsonLd("breadcrumbs");
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol style={{ 
        display: "flex", 
        listStyle: "none", 
        padding: 0, 
        margin: 0, 
        gap: "8px", 
        fontSize: "14px", 
        color: "#888",
        flexWrap: "wrap"
      }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isLast ? (
                <span aria-current="page" style={{ color: "#111", fontWeight: 600 }}>
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.path} style={{ color: "#D94F2B", textDecoration: "none" }}>
                    {item.label}
                  </Link>
                  <span aria-hidden="true" style={{ color: "#ccc" }}> / </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Breadcrumbs;