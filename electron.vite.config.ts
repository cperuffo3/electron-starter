import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  main: {
    // Main process configuration
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
      },
    },
    resolve: {
      alias: {
        "@main": resolve(__dirname, "./src/main"),
        "@shared": resolve(__dirname, "./src/shared"),
      },
    },
  },

  preload: {
    // Preload script configuration
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
      },
    },
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "./src/shared"),
      },
    },
  },

  renderer: {
    // Renderer process configuration (React app)
    root: "src/renderer",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
    publicDir: false,
    plugins: [
      viteStaticCopy({
        targets: [
          {
            // relative to the renderer root (src/renderer)
            src: "../../assets",
            dest: ".",
          },
        ],
      }),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: resolve(__dirname, "src/renderer/routes"),
        generatedRouteTree: resolve(__dirname, "src/renderer/routeTree.gen.ts"),
      }),
      tailwindcss(),
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src/renderer"),
        "@shared": resolve(__dirname, "./src/shared"),
      },
    },
  },
});
