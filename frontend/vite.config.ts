import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())]
      : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "..", "backend", "attached_assets")
    }
  },
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, "..", "dist/public"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
        ws: true,
      },


    },

    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

