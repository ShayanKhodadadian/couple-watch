import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When deploying the client to GitHub Pages under a repo subpath,
// set VITE_BASE (e.g. "/your-repo-name/") at build time.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
});
