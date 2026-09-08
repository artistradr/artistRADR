// Blog Pages
import BlogPage from "layouts/pages/blog/BlogPage";

// Public Pages
import ContactUs from "pages/ContactUs";

// Toolkit Pages
import Freebies from "pages/Toolkit/freebies";
import PremiumTools from "pages/Toolkit/premium-Tools";
import KnowledgeCenter from "pages/Toolkit/knowledge-center";
import PlaylistSubmissionPage from "pages/Toolkit/playlist-submission";

// Promotion Pages
import Promotion from "pages/promotion/Promotion";

// Auth Pages
import SignIn from "pages/Auth/SignIn";
import Register from "pages/Auth/Register";

// NOTE: SpotifyCallback and YoutubeCallback are registered directly in App.jsx
// as bare routes so they are never wrapped in any auth guard or navbar layout.

// NOTE: "My Campaigns" below intentionally has no `component` field. The
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
    name: "Get Started",
    collapse: [
      {
        name: "Playlist Submission",
        description: "Submit your track for playlists",
        route: "/submit-track",
        component: <PlaylistSubmissionPage />,
      },
      {
        name: "My Campaigns",
        description: "Track and manage your active promotion campaigns",
        route: "/campaigns",
        // no `component` — see note above, route is registered in App.jsx
      },
      {
        name: "Promotion",
        description: "Get your music discovered across platforms",
        route: "/promotion",
        component: <Promotion />,
      },
      {
        name: "Contact Us",
        description: "Get in touch with our team",
        route: "/contact-us",
        component: <ContactUs />,
      },
      {
        name: "Sign In",
        description: "Access your RADR account",
        route: "/sign-in",
        component: <SignIn />,
        guestOnly: true,
      },
      {
        name: "Register",
        description: "Join Artist RADR today",
        route: "/register",
        component: <Register />,
        guestOnly: true,
      },
    ],
  },
];

export default routes;