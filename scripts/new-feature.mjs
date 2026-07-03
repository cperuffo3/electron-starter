#!/usr/bin/env node

/**
 * Feature scaffold generator.
 *
 * Usage:
 *   pnpm new:feature <feature-name> [--renderer-only|--main-only]
 *
 * Stamps out the conventional shape on both sides of the IPC boundary:
 *
 *   src/main/core/<name>/            oRPC handlers + zod schemas (auto-wired
 *                                    into src/main/core/router.ts)
 *   src/renderer/features/<name>/    actions -> queries -> components taxonomy
 *
 * See CLAUDE.md ("Architecture & Conventions") for the rules the generated
 * files follow.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const names = args.filter((a) => !a.startsWith("--"));

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (names.length !== 1) {
  fail("Usage: pnpm new:feature <feature-name> [--renderer-only|--main-only]");
}

const name = names[0];
if (!KEBAB.test(name)) {
  fail(`Feature name must be kebab-case (got "${name}").`);
}

const rendererOnly = flags.includes("--renderer-only");
const mainOnly = flags.includes("--main-only");
if (rendererOnly && mainOnly) {
  fail("--renderer-only and --main-only are mutually exclusive.");
}

const camel = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const mainDir = path.join(ROOT, "src/main/core", name);
const featureDir = path.join(ROOT, "src/renderer/features", name);
const routerPath = path.join(ROOT, "src/main/core/router.ts");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function write(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  console.log(`  created ${path.relative(ROOT, filePath)}`);
}

// ─── main process module ────────────────────────────────────────────────────

async function scaffoldMain() {
  if (await exists(mainDir)) {
    fail(`src/main/core/${name} already exists.`);
  }

  await write(
    path.join(mainDir, "schemas.ts"),
    `import { z } from "zod";

export const getExampleInputSchema = z.object({
  name: z.string(),
});
`,
  );

  await write(
    path.join(mainDir, "handlers.ts"),
    `import { os } from "@orpc/server";
import { getExampleInputSchema } from "./schemas";

export const getExample = os
  .input(getExampleInputSchema)
  .handler(({ input }) => {
    return \`Hello from ${name}, \${input.name}!\`;
  });
`,
  );

  await write(
    path.join(mainDir, "index.ts"),
    `import { getExample } from "./handlers";

export const ${camel} = {
  getExample,
};
`,
  );

  // Wire the new module into the router
  let router = await fs.readFile(routerPath, "utf-8");
  if (router.includes(`"./${name}"`)) {
    console.log(`  router already imports ./${name}, skipping wiring`);
    return;
  }

  const importLine = `import { ${camel} } from "./${name}";\n`;
  const lastImport = router.lastIndexOf("\nimport ");
  const importEnd = router.indexOf("\n", lastImport + 1) + 1;
  router = router.slice(0, importEnd) + importLine + router.slice(importEnd);

  router = router.replace(/^};/m, `  ${camel},\n};`);
  await fs.writeFile(routerPath, router, "utf-8");
  console.log(`  wired ${camel} into src/main/core/router.ts`);
}

// ─── renderer feature module ────────────────────────────────────────────────

async function scaffoldRenderer() {
  if (await exists(featureDir)) {
    fail(`src/renderer/features/${name} already exists.`);
  }

  await write(
    path.join(featureDir, "types", `${name}.types.ts`),
    `// Types owned by the ${name} feature.
export {};
`,
  );

  if (!rendererOnly) {
    await write(
      path.join(featureDir, "actions", `${name}-actions.ts`),
      `import { ipc } from "@/lib/ipc-client";

export function getExample(name: string): Promise<string> {
  return ipc.client.${camel}.getExample({ name });
}
`,
    );

    await write(
      path.join(featureDir, "queries", `${name}-queries.ts`),
      `import { useQuery } from "@tanstack/react-query";
import { getExample } from "../actions/${name}-actions";

export function useExampleQuery(name: string) {
  return useQuery({
    queryKey: ["${name}", "example", name],
    queryFn: () => getExample(name),
  });
}
`,
    );
  }

  await fs.mkdir(path.join(featureDir, "components"), { recursive: true });

  const indexExports = rendererOnly
    ? [`export * from "./types/${name}.types";`]
    : [
        `export * from "./actions/${name}-actions";`,
        `export * from "./queries/${name}-queries";`,
        `export * from "./types/${name}.types";`,
      ];
  await write(
    path.join(featureDir, "index.ts"),
    indexExports.join("\n") + "\n",
  );
}

console.log(`Scaffolding feature "${name}"...`);
if (!rendererOnly) {
  await scaffoldMain();
}
if (!mainOnly) {
  await scaffoldRenderer();
}

console.log(`
Done. Next steps:
  - Implement your handlers in src/main/core/${name}/handlers.ts
  - Expose typed calls in src/renderer/features/${name}/actions/
  - Wrap them in TanStack Query hooks in queries/
  - Import the feature from a route: import { ... } from "@/features/${name}";
`);
