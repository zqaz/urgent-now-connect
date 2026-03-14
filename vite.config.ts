import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    headers: {
      // Keep security headers that don't block iframe previews
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "microphone=(self), geolocation=(self), camera=(), payment=()",
      // HSTS only applies in prod/HTTPS — kept here as documentation
      // "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
