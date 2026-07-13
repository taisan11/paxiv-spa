import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  css: {
    transformer: "lightningcss" as const
  },
  build: {
    target: "esnext",
    cssMinify: "lightningcss",
    manifest: true,
    rolldownOptions: {
      input: {
        main: resolve(__dirname, "index.html")
      },
      output: {
        entryFileNames: (chunkInfo) => {
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
