import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";
import boundaries from "eslint-plugin-boundaries";
import checkFile from "eslint-plugin-check-file";
import path from "node:path";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";

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
    files: ["scripts/**/*.{js,mjs,cjs}"],
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
            "${file.type} code may not import ${dependency.type} code (process/layer boundary)",
          rules: [
            // shared is imported by everyone, imports no one
            { from: { type: "shared" }, allow: [{ to: { type: "shared" } }] },
            // each Electron process only sees itself + shared
            {
              from: { type: "main" },
              allow: [{ to: { type: ["main", "shared"] } }],
            },
            {
              from: { type: "preload" },
              allow: [{ to: { type: ["preload", "shared"] } }],
            },
            // vendored shadcn registry: only itself + cn/hooks
            { from: { type: "ui" }, allow: [{ to: { type: ["ui", "base"] } }] },
            { from: { type: "base" }, allow: [{ to: { type: "base" } }] },
            // features never import routes; cross-feature imports allowed
            {
              from: { type: "feature" },
              allow: [
                {
                  to: { type: ["feature", "ui", "base", "renderer", "shared"] },
                },
              ],
            },
            {
              from: { type: "routes" },
              allow: [
                {
                  to: {
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
              ],
            },
            // everything else in the renderer (lib, shared components, entry)
            {
              from: { type: "renderer" },
              allow: [
                {
                  to: {
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
              ],
            },
            // the one sanctioned crack in the process wall: the renderer may
            // import the main-process oRPC router AS A TYPE ONLY (erased at
            // build time). Value imports of main code stay illegal.
            {
              from: { type: ["renderer", "feature"] },
              allow: [{ to: { type: "main" }, dependency: { kind: "type" } }],
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
