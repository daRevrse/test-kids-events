import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // Pour le développement local avec Netlify Dev
        target: "http://kidseventstickets.netlify.app",
        // target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  root: ".",
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          api: ["axios"],
        },
      },
      input: "./index.html",
    },
  },
  define: {
    // Variables d'environnement pour différencier dev/prod
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
});
