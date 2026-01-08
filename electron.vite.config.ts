import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  main: {
    // Main process configuration
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main.ts"),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  },

  preload: {
    // Preload script configuration
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload.ts"),
        },
      },
    },
  },

  renderer: {
    // Renderer process configuration (React app)
    root: ".",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "index.html"),
        },
      },
    },
    publicDir: false,
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "assets",
            dest: ".",
          },
        ],
      }),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  },
});
