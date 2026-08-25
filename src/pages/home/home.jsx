import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "layouts/Navbar";
import Footer from "layouts/Footer";
import routes from "routes";
import SEOHead from "components/SEOHead";

import HomeHero from "./components/HomeHero";
import HomeStats from "./components/HomeStats";
import HomeEditorial from "./components/HomeEditorial";
import HomeFreebies from "./components/HomeFreebies";
import HomeHowItWorks from "./components/HomeHowItWorks";
import HomePromotion from "./components/HomePromotion";
import HomeCTA from "./components/HomeCTA";

const F = { d: "var(--font-display)", b: "var(--font-body)" };

function Home() {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://artistradr.com/wp-json/wp/v2/posts?categories=3,4,5,19,20&_embed&per_page=6")
      .then((res) => setBlogPosts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const featured = blogPosts[0];
  const secondary = blogPosts.slice(1, 3);
  const rest = blogPosts.slice(3);

  return (
    <>
      <SEOHead
        title="Artist RADR — Discover Emerging Music Artists & Sounds"
        description="Artist RADR is a music discovery platform spotlighting emerging artists, curated playlists, and fresh sounds from around the world. Discover new talent, submit your track, and stay ahead of the curve."
        path="/"
      />

      <div style={{ fontFamily: F.b, background: "#f7f6f3", minHeight: "100vh" }}>
        <Navbar routes={routes} action={{ type: "internal", route: "/submit-track", label: "Submit Track" }} />

        <HomeHero />
        <HomeStats />
        <HomeEditorial featured={featured} secondary={secondary} rest={rest} loading={loading} />
        <HomeFreebies />
        <HomeHowItWorks />
        <HomePromotion />
        <HomeCTA />

        <Footer />
      </div>
    </>
  );
}

export default Home;