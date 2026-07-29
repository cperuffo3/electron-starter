import { includeIgnoreFile } from "@eslint/compat";
import pluginJs from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import checkFile from "eslint-plugin-check-file";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";
import { defineConfig } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prettierIgnorePath = path.resolve(__dirname, ".prettierignore");

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
  includeIgnoreFile(prettierIgnorePath),
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  },
  { languageOptions: { globals: globals.browser } },
  {
    files: ["scripts/**/*.{js,mjs,cjs}", "*.cjs"],
    languageOptions: { globals: globals.node },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "tailwind-canonical-classes": tailwindCanonicalClasses,
    },
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./src/renderer/styles/global.css",
          rootFontSize: 16,
        },
      ],
    },
  },

  // ─── Architectural boundaries ──────────────────────────────────────────
  // src/ is split by Electron process: main/, preload/, renderer/, shared/.
  // Within the renderer, code is layered docmost-style: vendored ui, base
  // utilities, feature modules, routes, and everything else (lib, shared
  // components, entry). These rules make illegal imports a lint error
  // instead of a convention.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: [
            "src/renderer/tsconfig.json",
            "src/main/tsconfig.json",
            "src/preload/tsconfig.json",
          ],
          noWarnOnMultipleProjects: true,
        },
      },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "shared", pattern: "src/shared" },
        { type: "main", pattern: "src/main" },
        { type: "preload", pattern: "src/preload" },
        { type: "ui", pattern: "src/renderer/components/ui" },
        {
          type: "base",
          pattern: ["src/renderer/utils", "src/renderer/hooks"],
        },
        {
          type: "feature",
          pattern: "src/renderer/features/*",
          capture: ["feature"],
        },
        { type: "routes", pattern: "src/renderer/routes" },
        { type: "renderer", pattern: "src/renderer" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "{{from.type}} code may not import {{to.type}} code (process/layer boundary)",
          policies: [
            // shared is imported by everyone, imports no one
            {
              from: { element: { type: "shared" } },
              allow: [{ to: { element: { type: "shared" } } }],
            },
            // each Electron process only sees itself + shared
            {
              from: { element: { type: "main" } },
              allow: [{ to: { element: { type: ["main", "shared"] } } }],
            },
            {
              from: { element: { type: "preload" } },
              allow: [{ to: { element: { type: ["preload", "shared"] } } }],
            },
            // vendored shadcn registry: only itself + cn/hooks
            {
              from: { element: { type: "ui" } },
              allow: [{ to: { element: { type: ["ui", "base"] } } }],
            },
            {
              from: { element: { type: "base" } },
              allow: [{ to: { element: { type: "base" } } }],
            },
            // features never import routes; cross-feature imports allowed
            {
              from: { element: { type: "feature" } },
              allow: [
                {
                  to: {
                    element: {
                      type: ["feature", "ui", "base", "renderer", "shared"],
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: "routes" } },
              allow: [
                {
                  to: {
                    element: {
                      type: [
                        "routes",
                        "feature",
                        "ui",
                        "base",
                        "renderer",
                        "shared",
                      ],
                    },
                  },
                },
              ],
            },
            // everything else in the renderer (lib, shared components, entry)
            {
              from: { element: { type: "renderer" } },
              allow: [
                {
                  to: {
                    element: {
                      type: [
                        "renderer",
                        "ui",
                        "base",
                        "feature",
                        "routes",
                        "shared",
                      ],
                    },
                  },
                },
              ],
            },
            // the one sanctioned crack in the process wall: the renderer may
            // import the main-process oRPC router AS A TYPE ONLY (erased at
            // build time). Value imports of main code stay illegal.
            {
              from: { element: { type: ["renderer", "feature"] } },
              allow: [
                {
                  to: { element: { type: "main" } },
                  dependency: { kind: "type" },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─── File & folder naming ──────────────────────────────────────────────
  // kebab-case everywhere; suffix conventions (-actions, -queries, .types)
  // are documented in CLAUDE.md. Routes are exempt (TanStack needs __root).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/renderer/routes/**"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/": "KEBAB_CASE" },
      ],
    },
  },

  {
    files: [
      "src/renderer/components/ui/**/*.{ts,tsx}",
      "src/renderer/hooks/use-mobile.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
]);
