import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // pinned explicitly — avoids the localhost→::1/127.0.0.1
                        // ambiguity that caused ERR_CONNECTION_REFUSED when the
                        // Spotify OAuth redirect hit 127.0.0.1 directly while
                        // Vite's default `localhost` binding landed on ::1 only.
    port: 5173,
  },
  resolve: {
    alias: {
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      examples: fileURLToPath(new URL("./src/examples", import.meta.url)),
      assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
      layouts: fileURLToPath(new URL("./src/layouts", import.meta.url)),
      pages: fileURLToPath(new URL("./src/pages", import.meta.url)),
      context: fileURLToPath(new URL("./src/context", import.meta.url)),
      routes: fileURLToPath(new URL("./src/routes.jsx", import.meta.url)),
      "footer.routes": fileURLToPath(new URL("./src/footer.routes.jsx", import.meta.url)),
    },
  },
});