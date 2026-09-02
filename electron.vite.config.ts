import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { type UserConfig, defineConfig } from "electron-vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(async () => {
  // @vitejs/plugin-react 6 dropped its Babel integration (Vite 8 handles
  // React Refresh via Oxc), so the React Compiler now runs through
  // @rolldown/plugin-babel. reactCompilerPreset() ships a file filter so
  // Babel only touches modules that can contain components or hooks.
  // babel() returns a Promise and electron-vite deep-clones the config
  // (rejecting non-plain objects), so it is resolved up front.
  const reactCompiler = await babel({
    presets: [reactCompilerPreset()],
  });

  const config: UserConfig = {
    main: {
      // Main process configuration
      build: {
        outDir: "dist/main",
        rolldownOptions: {
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
        rolldownOptions: {
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
        rolldownOptions: {
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
          generatedRouteTree: resolve(
            __dirname,
            "src/renderer/routeTree.gen.ts",
          ),
        }),
        tailwindcss(),
        react(),
        reactCompiler,
      ],
      resolve: {
        alias: {
          "@": resolve(__dirname, "./src/renderer"),
          "@shared": resolve(__dirname, "./src/shared"),
        },
      },
    },
  };

  return config;
});
