import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxying /api means the frontend code can just call fetch("/api/...")
// without hardcoding http://localhost:5000 everywhere, and it makes the
// dev setup behave the same way a production reverse proxy would.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5006",
        changeOrigin: true,
      },
    },
  },
});
