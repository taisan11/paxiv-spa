import { defineConfig, type Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

function swPrecachePlugin(): Plugin {
  return {
    name: "sw-precache",
    apply: "build",
    closeBundle() {
      const outDir = resolve(__dirname, "dist");
      const manifestPath = resolve(outDir, ".vite/manifest.json");
      const swPath = resolve(outDir, "sw.js");

      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        const assets: string[] = ["/", "/index.html"];

        for (const [, entry] of Object.entries(manifest)) {
          if (typeof entry === "object" && entry !== null && "file" in entry) {
            assets.push(`/${(entry as { file: string }).file}`);
          }
        }

        let sw = readFileSync(swPath, "utf-8");
        // ミニファイ前後両方対応: ["FILE_LIST"] または [`FILE_LIST`]
        sw = sw.replace(/\[(`|"|')FILE_LIST(`|"|')\]/, JSON.stringify(assets));
        writeFileSync(swPath, sw);
        console.log(`[sw-precache] ${assets.length} assets added to SW precache`);
      } catch (err) {
        console.error("[sw-precache] Failed:", err);
      }
    }
  };
}

export default defineConfig({
  plugins: [solidPlugin(), swPrecachePlugin()],
  css: {
    transformer: "lightningcss" as const
  },
  build: {
    target: "esnext",
    cssMinify: "lightningcss",
    manifest: true,
    rolldownOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        sw: resolve(__dirname, "src/sw.ts")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "sw") return "sw.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
