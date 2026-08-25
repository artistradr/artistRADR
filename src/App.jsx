import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "assets/theme";
import routes from "./routes";
import { AuthProvider } from "context/AuthContext";
import { AuthGateProvider } from "context/AuthGateContext";
import { SupabaseAuthProvider, useSupabaseAuth } from "context/SupabaseAuthContext";

import RouteSEO from "components/RouteSEO"; // adjust path to wherever you place RouteSEO.jsx

import Home from "pages/home/Home";
import Profile from "pages/Auth/Profile";
import ForgotPassword from "pages/Auth/ForgotPassword";
import ResetPassword from "pages/Auth/ResetPassword";
import AdminLogin from "pages/Admin/AdminLogin";
import AdminDashboard from "pages/Admin/AdminDashboard";
import PostEditor from "pages/Admin/PostEditor";
import SpotifyCallback from "pages/Auth/SpotifyCallback";
import YoutubeCallback from "pages/Auth/YoutubeCallback";
import BlogPost from "layouts/pages/blog/BlogPost";

import Promotion from "pages/promotion/Promotion";

function AdminRoute({ children }) {
  const { user, userRole, loading, roleLoading } = useSupabaseAuth();
  if (loading || roleLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0E0E", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (userRole !== "radrStaff") return <Navigate to="/" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useSupabaseAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

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
           (Home "/", /blog/:slug, admin, auth callbacks, password reset)
           render null here and rely on their own page-level <SEOHead />
           or on SEOHead's defaults — see RouteSEO.jsx for the full list. */}
      <RouteSEO />

      <Routes>
        {/* ── Routes from routes.js (navbar-driven pages) ── */}
        {getRoutes(routes)}

        {/* ── Home ── */}
        <Route path="/" element={<Home />} />
        <Route path="/promotion" element={<Promotion />} />

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
    <AuthProvider>
      <SupabaseAuthProvider>
        <AuthGateProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRoutes />
          </ThemeProvider>
        </AuthGateProvider>
      </SupabaseAuthProvider>
    </AuthProvider>
  );
} 