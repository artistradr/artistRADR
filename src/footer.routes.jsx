// Social icons (using text fallbacks — swap with real icon components as needed)
const footerRoutes = {
  brand: {
    image: "", // Add your logo path here e.g. "/logo.png"
    name: "Artist RADR",
    route: "/",
  },
  socials: [
    {
      icon: "𝕏", // Replace with <TwitterIcon /> if you import MUI icons
      link: "https://twitter.com/artistradr",
    },
    {
      icon: "in",
      link: "https://instagram.com/artistradr",
    },
  ],
};

export default footerRoutes;
