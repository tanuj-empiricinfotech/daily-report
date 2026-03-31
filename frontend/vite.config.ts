import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

/** Generates a version.json in the build output with a unique build hash. */
function versionPlugin(): Plugin {
  return {
    name: 'version-json',
    apply: 'build',
    closeBundle() {
      const version = Date.now().toString(36);
      const outDir = path.resolve(__dirname, 'dist');
      fs.writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify({ version }),
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { allowedHosts: true },
  optimizeDeps: {
    include: ['@reduxjs/toolkit'],
  },
})
