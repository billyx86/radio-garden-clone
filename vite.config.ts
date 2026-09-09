import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  preview: { host: "0.0.0.0", port: 8080, strictPort: true },
  plugins: [react(), tailwindcss()],
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
