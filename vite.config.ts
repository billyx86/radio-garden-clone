import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// E2E_PORT lets the Playwright suite (vite preview) run on an alternate port
// when 8080 is occupied locally — see playwright.config.ts.
const port = Number(process.env.E2E_PORT ?? 8080);

export default defineConfig({
  server: { host: "0.0.0.0", port, strictPort: true },
  preview: { host: "0.0.0.0", port, strictPort: true },
  plugins: [react(), tailwindcss()],
  test: {
    // Unit tests live in src/; e2e/ is Playwright's turf (see
    // playwright.config.ts) and must never be collected by vitest.
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest, least-changing dependencies out of the app
        // chunk so they cache independently across deploys and the main
        // bundle stays under Vite's 500 kB warning line.
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-hls": ["hls.js"],
        },
      },
    },
  },
});
