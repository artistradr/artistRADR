import { useLocation } from "react-router-dom";
import SEOHead from "./SEOHead";
import seoRoutes from "./getSeoRoutes";

/**
 * RouteSEO — automatically injects SEO tags for routes defined in routes.js.
 * 
 * Renders nothing visible. It reads the current URL path, looks up the matching
 * route in the flattened seoRoutes map, and renders <SEOHead /> with the
 * title and description from routes.js.
 * 
 * Usage: Place <RouteSEO /> once inside <Routes> in App.jsx.
 * It will automatically handle every route that's defined in routes.js.
 */
function RouteSEO() {
  const { pathname } = useLocation();

  // Find matching route in our map
  const matchedRoute = Object.keys(seoRoutes).find(
    (routePath) => pathname === routePath || pathname.startsWith(routePath + "/")
  );

  if (!matchedRoute) return null;

  const { title, description } = seoRoutes[matchedRoute];
  
  return <SEOHead title={title} description={description} path={pathname} />;
}

export default RouteSEO;