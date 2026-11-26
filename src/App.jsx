// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "assets/theme";
import routes from "./routes";
import { AuthGateProvider } from "context/AuthGateContext";
import { SupabaseAuthProvider, useSupabaseAuth } from "context/SupabaseAuthContext";

import RouteSEO from "components/RouteSEO"; // adjust path to wherever you place RouteSEO.jsx

import Home from "pages/home/Home";
import Profile from "pages/Auth/Profile";
import ForgotPassword from "pages/Auth/ForgotPassword";
import ResetPassword from "pages/Auth/ResetPassword";
import AdminLogin from "pages/Admin/AdminLogin";
import AdminDashboard from "pages/Admin/AdminDashboard/AdminDashboard";
import PostEditor from "pages/Admin/PostEditor";
import SpotifyCallback from "pages/Auth/SpotifyCallback";
import YoutubeCallback from "pages/Auth/YoutubeCallback";
import BlogPost from "layouts/pages/blog/BlogPost";
import PrivacyPolicy from "pages/PrivacyPolicy";
import TermsAndConditions from "pages/TermsAndConditions";

import Promotion from "pages/promotion/Promotion";
import CampaignDashboard from "pages/campaigns/CampaignDashboard";
import Billing from "pages/campaigns/Billing";

// ── Studio shell ────────────────────────────────────────────────────────
import StudioLayout from "./studio/StudioLayout";
import StudioHome from "./studio/StudioHome";
import PlaylistsPage from "./studio/pages/PlaylistsPage";
import DiscoveryPage from "./studio/pages/DiscoveryPage";
import Top10Generator from "./studio/pages/Top10Generator";
import ArtworkLibrary from "./studio/pages/ArtworkLibrary";
import SubmissionsPage from "./studio/pages/SubmissionsPage";
import { MagazineList, MagazineEditor } from "./studio/pages/MagazinePages";
import StudioSpotifyCallback from "./studio/StudioSpotifyCallback";

// ── Build mode ──────────────────────────────────────────────────────────
// "web"    -> artistradr.com          (public site + magazine + admin)
// "studio" -> studio.artistradr.com   (admin / Studio only)
// Set by VITE_APP_MODE in .env.studio (see package.json scripts).
const IS_STUDIO = import.meta.env.VITE_APP_MODE === "studio";

const fullScreenMessage = {
  minHeight: "100vh",
  background: "#0E0E0E",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.4)",
  fontSize: "14px",
};

function AdminRoute({ children }) {
  const { user, userRole, loading, roleLoading } = useSupabaseAuth();
  if (loading || roleLoading) {
    return <div style={fullScreenMessage}>Loading…</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (userRole !== "radrStaff") {
    // On the Studio subdomain there is no public home page to send people to,
    // so redirecting to "/" would loop. Show a message instead.
    if (IS_STUDIO) {
      return (
        <div style={{ ...fullScreenMessage, color: "rgba(255,255,255,0.5)" }}>
          RADR Studio is restricted to Artist RADR staff.
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }
  return children;
}

function LegacyEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/studio/magazine/edit/${id}`} replace />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useSupabaseAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

// ── Studio build: admin + Studio routes only ────────────────────────────
function StudioRoutes() {
  useEffect(() => {
    // Keep Studio out of search engines.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    document.title = "RADR Studio";
    return () => meta.remove();
  }, []);

  return (
    <Routes>
      {/* ── Existing admin (Magazine): unchanged, full-page ── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      {/* Old Magazine admin addresses now land in Studio */}
      <Route path="/admin" element={<Navigate to="/studio/magazine" replace />} />
      <Route path="/admin/new" element={<Navigate to="/studio/magazine/new" replace />} />
      <Route path="/admin/edit/:id" element={<LegacyEditRedirect />} />

      {/* ── Studio shell ── */}
      <Route path="/studio" element={<AdminRoute><StudioLayout /></AdminRoute>}>
        <Route index element={<StudioHome />} />
        <Route path="discovery" element={<DiscoveryPage />} />
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="spotify/callback" element={<StudioSpotifyCallback />} />
        <Route path="artwork/top10" element={<Top10Generator />} />
        <Route path="artwork/library" element={<ArtworkLibrary />} />
        <Route path="submissions" element={<SubmissionsPage />} />
        <Route path="magazine" element={<MagazineList />} />
        <Route path="magazine/new" element={<MagazineEditor />} />
        <Route path="magazine/edit/:id" element={<MagazineEditor />} />
      </Route>

      {/* Everything else goes to the Studio overview (logged-out users go to login) */}
      <Route path="*" element={<Navigate to="/studio" replace />} />
    </Routes>
  );
}

// ── Public build: the full site (unchanged) ─────────────────────────────
function AppRoutes() {
  const { pathname } = useLocation();
  const { user, userRole } = useSupabaseAuth();

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route) => {
      if (route.collapse) return getRoutes(route.collapse);
      if (route.toolkitOnly && userRole !== "subscriber" && userRole !== "radrStaff") return [];
      if (route.adminOnly && userRole !== "radrStaff") return [];
      if (route.guestOnly && user) return [];
      return route.route && route.component
        ? [<Route path={route.route} element={route.component} key={route.route} />]
        : [];
    });

  return (
    <>
      {/* ── Automatic per-route SEO tags, driven by routes.js ──
           Covers every route listed in routes.js. Routes NOT in that map
           (Home "/", /blog/:slug, admin, auth callbacks, password reset,
           /campaigns, /privacy-policy, /terms-and-conditions) render null
           here and rely on their own page-level <SEOHead /> or on
           SEOHead's defaults — see RouteSEO.jsx for the full list. */}
      <RouteSEO />

      <Routes>
        {/* ── Routes from routes.js (navbar-driven pages) ── */}
        {getRoutes(routes)}

        {/* ── Home ── */}
        <Route path="/" element={<Home />} />
        <Route path="/promotion" element={<Promotion />} />

        {/* ── Campaign Dashboard — bare route, not in routes.js ──
             Reached via "Start Campaign" CTAs across the Promotion page,
             not a navbar destination itself. Auth-gated: manages billing
             and campaign spend, same guard as /profile. */}
        <Route path="/campaigns" element={<PrivateRoute><CampaignDashboard /></PrivateRoute>} />
        <Route path="/campaigns/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />

        {/* ── Legal — bare routes, not in routes.js ──
             Previously a "Legal" navbar dropdown; that group has been
             removed from the nav entirely. Link to these from the Footer. */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

        {/* ── Blog post — bare route, not in routes.js ──
             Reached only via links from BlogPage (e.g. /blog/${post.slug}),
             never a navbar destination itself, so no auth guard needed. */}
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* ── OAuth callbacks — MUST be bare routes, never inside an auth guard ──
             The popup window lands here after Spotify/Google redirect back.
             Each posts the code to the opener window then closes itself.       */}
        <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
        <Route path="/auth/youtube/callback" element={<YoutubeCallback />} />

        {/* ── Password reset — also bare routes, not in routes.js ──
             /forgot-password is only reached via the "Forgot?" link on SignIn.
             /reset-password is only reached via the Supabase recovery-email
             link. Neither is a navbar destination, so no auth guard needed. */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Auth pages ── */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* ── Admin — Supabase auth (see AdminRoute above) ── */}
        <Route path="/admin/login"    element={<AdminLogin />} />
        <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/new"      element={<AdminRoute><PostEditor /></AdminRoute>} />
        <Route path="/admin/edit/:id" element={<AdminRoute><PostEditor /></AdminRoute>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <AuthGateProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {IS_STUDIO ? <StudioRoutes /> : <AppRoutes />}
        </ThemeProvider>
      </AuthGateProvider>
    </SupabaseAuthProvider>
  );
}