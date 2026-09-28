import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/outpost-prototype/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        "**/qa/**",
        "**/qa-results/**",
        "**/test-results/**",
        "**/references/**",
        "**/design-reference/**",
      ],
    },
  },
});
