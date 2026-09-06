import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), cloudflare()],
  // MapLibre ships its tile-parsing worker as a separate chunk and locates it
  // via `import.meta.url`. Once Vite bundles the main entry, that path no longer
  // resolves, so the worker 404s and no vector tiles are ever parsed. We hand
  // MapLibre an explicit, Vite-built worker URL instead (see MapView.tsx), which
  // requires ES module output so the worker's own imports keep working.
  worker: { format: "es" },
});
