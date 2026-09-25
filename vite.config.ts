import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// GitHub Pages serves project sites at /<repo>/; overridable for forks/custom domains.
const base = process.env.VITE_BASE ?? "/SejmSim/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  worker: { format: "es" },
});
