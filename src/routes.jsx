// Blog Pages
import BlogPage from "layouts/pages/blog/BlogPage";

// Public Pages
import ContactUs from "pages/ContactUs";
import PrivacyPolicy from "pages/PrivacyPolicy";
import TermsAndConditions from "pages/TermsAndConditions";

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
  {
    // Not in navRoutes' visible collapses — Privacy Policy is linked from the
    // Footer, not the main nav, but still needs to be a routed page. If your
    // Navbar component only renders items from named collapse groups above,
    // this entry still works because App.jsx's getRoutes() flattens every
    // collapse group recursively — it'll just render only in the Footer link,
    // not as a nav dropdown item, unless you also add it above.
    name: "Legal",
    collapse: [
      {
        name: "Privacy Policy",
        description: "How we handle your data",
        route: "/privacy-policy",
        component: <PrivacyPolicy />,
      },
      {
        name: "Terms & Conditions",
        description: "Rules for using RADR",
        route: "/terms-and-conditions",
        component: <TermsAndConditions />,
      },
    ],
  },
];

export default routes;