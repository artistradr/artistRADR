// Blog Pages
import BlogPage from "layouts/pages/blog/BlogPage";

// Public Pages
import ContactUs from "pages/ContactUs";

// Toolkit Pages
import Freebies from "pages/Toolkit/freebies";
import PremiumTools from "pages/Toolkit/premium-Tools";
import KnowledgeCenter from "pages/Toolkit/knowledge-center";
import PlaylistSubmissionPage from "pages/Toolkit/playlist-submission";
import SpotlightSubmissionPage from "pages/Toolkit/spotlight-submission";

// Promotion Pages
import Promotion from "pages/promotion/Promotion";

// Auth Pages
import SignIn from "pages/Auth/SignIn";
import Register from "pages/Auth/Register";

// NOTE: SpotifyCallback and YoutubeCallback are registered directly in App.jsx
// as bare routes so they are never wrapped in any auth guard or navbar layout.

// NOTE: "Campaign Dashboard" below intentionally has no `component` field. The
// actual <Route path="/campaigns"> is registered as a bare, auth-gated
// route directly in App.jsx (same pattern as /profile), so it's excluded
// from getRoutes()'s flatMap (which requires both `route` AND `component`).
// This entry exists only so the link shows up in the navbar — omitting
// `component` here avoids registering a second, duplicate <Route> for the
// same path.

// NOTE: Privacy Policy and Terms & Conditions used to live here as a
// "Legal" nav group. That group has been removed entirely from the navbar.
// Their routes are now registered as bare routes directly in App.jsx
// (same pattern as /campaigns) and linked from the Footer instead.

// NOTE: `badge` shows a small tag (for example "New") next to a nav link.

const routes = [
  {
    name: "Discover & Explore",
    collapse: [
      {
        name: "On Your RADR",
        description: "Latest artists & editorial",
        route: "/blog",
        component: <BlogPage />,
      },
      {
        name: "Promotion",
        description: "Get your music discovered across platforms",
        route: "/promotion",
        component: <Promotion />,
      },
      {
        name: "Freebies",
        description: "Free tools for creators",
        route: "/pages/toolkit/freebies",
        component: <Freebies />,
      },
      {
        name: "Premium Tools",
        description: "Exclusive subscriber tools",
        route: "/pages/toolkit/premium-tools",
        component: <PremiumTools />,
      },
      {
        name: "Knowledge Center",
        description: "Guides to grow your career",
        route: "/pages/toolkit/knowledge-center",
        component: <KnowledgeCenter />,
      },
    ],
  },
  {
    name: "Campaigns",
    collapse: [
      {
        name: "Campaign Dashboard",
        description: "Track and manage your active promotion campaigns",
        route: "/campaigns",
        userOnly: true,
        // no `component` — see note above, route is registered in App.jsx
      },
      {
        name: "Submit Playlist Consideration",
        description: "Submit your track for RADR playlists",
        route: "/submit-track",
        component: <PlaylistSubmissionPage />,
      },
      {
        name: "Submit Spotlight Consideration",
        description: "Be considered for a RADR Spotlight feature",
        route: "/submit-spotlight",
        badge: "New",
        component: <SpotlightSubmissionPage />,
      },
    ],
  },
  {
    name: "Support",
    description: "Contact our team and track your tickets",
    route: "/support",
    userOnly: true,
    // no `component` — auth-gated route registered in App.jsx
  },
  {
    name: "Contact Us",
    description: "Get in touch with our team",
    route: "/contact-us",
    component: <ContactUs />,
    guestOnly: true,
  },
  // Sign In and Register are navbar buttons, so they're hidden from the links.
  {
    name: "Sign In",
    description: "Access your RADR account",
    route: "/sign-in",
    component: <SignIn />,
    guestOnly: true,
    navHidden: true,
  },
  {
    name: "Register",
    description: "Join Artist RADR today",
    route: "/register",
    component: <Register />,
    guestOnly: true,
    navHidden: true,
  },
];

export default routes;
