# CLAUDE.md

This file provides quick guidance to Claude Code when working with this repository.

> **For comprehensive documentation**, see [.context/STARTER_GUIDE.md](.context/STARTER_GUIDE.md) which covers architecture, patterns, and step-by-step instructions for all common tasks.

## Quick Reference

### Commands

```bash
# Development
pnpm run dev                # Run app in dev mode (hot reload)
pnpm run start              # Alias for dev

# Build
pnpm run build              # Build for production

# Code Quality
pnpm run lint               # ESLint check and fix (includes boundary + naming rules)
pnpm run type-check         # Type-check all three processes (main, preload, renderer)
pnpm run format             # Prettier format

# Package & Distribute
pnpm run package            # Package without creating installer
pnpm run make               # Create distributable installers
pnpm run make:win           # Windows only (NSIS)
pnpm run make:mac           # macOS only (ZIP)
pnpm run make:linux         # Linux only (DEB, RPM)

# Release
pnpm run release            # Interactive version bump + changelog
pnpm run release:patch      # Bump patch version (0.1.0 → 0.1.1)

# Utilities
pnpm run init-project       # Project setup wizard
pnpm run new:feature        # Scaffold a feature module (main + renderer)
pnpm run generate-icons     # Generate icons from assets/icons/icon.svg
pnpm run bump-shadcn-components  # Update shadcn/ui components
```

### Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Framework    | Electron 41 + electron-vite           |
| Build        | Vite 7 (via electron-vite)            |
| Packaging    | electron-builder                      |
| UI           | React 19 + TypeScript 5.9             |
| Styling      | Tailwind CSS 4 + shadcn/ui            |
| Routing      | TanStack Router (file-based)          |
| Server state | TanStack Query (wraps IPC actions)    |
| IPC          | oRPC (type-safe RPC over MessagePort) |
| Updates      | electron-updater (GitHub Releases)    |
| Env Vars     | dotenv (.env files)                   |

## Architecture & Conventions

`src/` is physically split by Electron process, and the renderer is organized
feature-first (docmost-style). **These rules are enforced by ESLint**
(`eslint-plugin-boundaries` + `eslint-plugin-check-file`) — illegal imports and
wrongly named files are lint errors, not suggestions.

```
src/
├── main/                      # Main process ("the server")
│   ├── index.ts               #   Bootstrap only: app lifecycle wiring
│   ├── core/<domain>/         #   oRPC modules: handlers.ts, schemas.ts, index.ts
│   │   ├── router.ts          #   Aggregates all domain routers
│   │   ├── rpc-server.ts      #   MessagePort handshake + RPCHandler
│   │   └── context.ts         #   Per-request window context middleware
│   ├── integrations/<infra>/  #   Wrappers around external systems (updater, ...)
│   ├── windows/               #   BrowserWindow factories
│   └── common/                #   Cross-cutting (env loading, ...)
├── preload/                   # contextBridge only; index.d.ts types the window API
├── renderer/                  # Renderer process ("the client")
│   ├── index.tsx  app.tsx     #   Entry + root providers (Query, Theme, Router)
│   ├── features/<feature>/    #   Feature modules — the default home for new code
│   │   ├── actions/           #     <feature>-actions.ts — typed IPC calls (only layer that touches ipc client)
│   │   ├── queries/           #     <feature>-queries.ts — TanStack Query hooks wrapping actions
│   │   ├── components/        #     Feature-owned React components
│   │   ├── hooks/             #     Feature-owned hooks
│   │   ├── types/             #     <feature>.types.ts
│   │   └── index.ts           #     Public API barrel — import features through this
│   ├── routes/                #   TanStack file routes — thin, compose features
│   ├── components/            #   ui/ (vendored shadcn), shared/, layouts/ — generic only
│   ├── lib/                   #   ipc-client, query-client, router, constants
│   ├── hooks/ + utils/        #   shadcn support files (use-mobile, cn) — don't grow these
│   └── styles/                #   global.css (Tailwind 4 + design tokens)
└── shared/                    # Cross-process types/constants; imports NOTHING
```

### Boundary rules (lint-enforced)

- `main`, `preload`, `renderer` may not import each other; all may import `shared`.
  Exception: the renderer may import the main router **as a type only**
  (`import type { router } from "@main/core/router"` in `lib/ipc-client.ts`).
- `components/ui/` (vendored shadcn) may only import other ui components and
  `utils`/`hooks`. Never edit these files by hand.
- `features/` may not import `routes/`. Routes compose features, never the reverse.
- Data flow inside a feature: components → queries → actions → `lib/ipc-client`.
  Components don't call `ipc.client` directly.

### Naming rules (lint-enforced)

- All files and folders in `src/` are **kebab-case** (routes exempt: TanStack needs `__root.tsx`).
- Suffix conventions: `<feature>-actions.ts`, `<feature>-queries.ts`,
  `<feature>.types.ts`, `handlers.ts`, `schemas.ts`.

### Adding a feature

Run `pnpm new:feature <kebab-name>`. It scaffolds `src/main/core/<name>/`
(handlers + schemas), auto-wires the router, and stamps out
`src/renderer/features/<name>/` with the actions/queries/types taxonomy.
Use `--renderer-only` for UI-only features, `--main-only` for main-only domains.

### IPC Pattern

```typescript
// 1. Handler (src/main/core/<domain>/handlers.ts) — zod-validated input
export const myHandler = os.input(z.object({ name: z.string() }))
  .handler(({ input }) => { /* main process code */ });

// 2. Register in the domain barrel + router (src/main/core/router.ts)
export const router = { ..., myDomain };

// 3. Action wrapper (src/renderer/features/<feature>/actions/<feature>-actions.ts)
export const myAction = (name: string) => ipc.client.myDomain.myHandler({ name });

// 4. Query hook (src/renderer/features/<feature>/queries/<feature>-queries.ts)
export const useMyQuery = (name: string) =>
  useQuery({ queryKey: ["myDomain", name], queryFn: () => myAction(name) });

// 5. Use in a component
const { data } = useMyQuery("value");
```

One-way main→renderer events (rare; e.g. updater progress) go through
`webContents.send` + a `contextBridge` API in `src/preload/index.ts`, with
channel names in `src/shared/constants.ts` and types in `src/shared/types/`.

### Path Aliases

| Alias       | Target          | Available in                 |
| ----------- | --------------- | ---------------------------- |
| `@/*`       | `src/renderer/` | renderer                     |
| `@main/*`   | `src/main/`     | main (+ renderer, type-only) |
| `@shared/*` | `src/shared/`   | all processes                |

```typescript
import { UPDATE_CHANNELS } from "@shared/constants";

import { Button } from "@/components/ui/button";
import { ipc } from "@/lib/ipc-client";
```

### TypeScript configs

Solution-style: root `tsconfig.json` only references the per-process configs
(`src/main/tsconfig.json`, `src/preload/tsconfig.json`,
`src/renderer/tsconfig.json`, sharing `src/tsconfig.base.json`). Each process
gets the correct `lib`/`types` for its runtime. `pnpm type-check` runs all three.

### Styling Rules

**ALWAYS use Tailwind CSS classes for all styling. NEVER use:**

- Inline styles (`style={{ }}`)
- Custom CSS files or `<style>` tags
- Hardcoded color values (hex, rgb, hsl) or raw palette classes (`text-yellow-500`)
- CSS-in-JS solutions

**Use Tailwind's design system:**

- Colors: `bg-primary`, `text-muted-foreground`, `border-border`, `text-warning`, `text-success`, etc.
- Spacing: `p-4`, `mt-2`, `gap-3`, etc.
- Typography: `text-sm`, `font-medium`, etc.
- Use CSS variables from the theme via Tailwind classes (e.g., `bg-background`, `text-foreground`).
  Add new tokens to `src/renderer/styles/global.css` (`:root`, `.dark`, and `@theme inline`) instead of hardcoding.

### UI Components

**ALWAYS prefer shadcn/ui components from `src/renderer/components/ui/` over building primitives from scratch or pulling in another component library.** The full shadcn registry is pre-installed — check `src/renderer/components/ui/` first before reaching for hand-rolled markup or `<input>`/`<button>`/`<select>` HTML elements.

**Available shadcn components** (import from `@/components/ui/<name>`):

- **Inputs & forms**: `button`, `button-group`, `input`, `input-group`, `input-otp`, `textarea`, `label`, `checkbox`, `radio-group`, `switch`, `slider`, `select`, `native-select`, `combobox`, `field`, `toggle`, `toggle-group`, `calendar`, `date-picker` (custom), `number-input` (custom)
- **Overlays**: `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`, `command`, `context-menu`, `dropdown-menu`, `menubar`
- **Layout & navigation**: `card`, `separator`, `tabs`, `accordion`, `collapsible`, `aspect-ratio`, `scroll-area`, `resizable`, `sidebar`, `navigation-menu`, `breadcrumb`, `pagination`
- **Feedback & data**: `alert`, `badge`, `progress`, `skeleton`, `spinner`, `sonner` (toasts), `empty`, `kbd`, `item`, `table`, `chart`, `carousel`, `avatar`

**Rules:**

- If a component already exists in `src/renderer/components/ui/`, use it. Do **not** rebuild it.
- For icons, use `lucide-react` (matches `components.json` `iconLibrary`).
- Don't edit files in `src/renderer/components/ui/` for visual tweaks; they're regenerated by `pnpm run bump-shadcn-components`. Customize via props, wrapper components, or theme tokens in `src/renderer/styles/global.css`.
- To add a new shadcn component (e.g., a future one), use `npx shadcn@latest add <name>`.
- For toasts, use `sonner` (wired up via `@/components/ui/sonner`), not a homegrown toast.
- For forms, prefer the new `field` primitive over the legacy `form` (which is intentionally empty in shadcn v3+).

### Adding Routes

Create `src/renderer/routes/<name>.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/<name>")({
  component: () => <div>My Page</div>,
});
```

### Build Configuration

The project uses **electron-vite** for building with a unified [electron.vite.config.ts](electron.vite.config.ts) configuration that handles:

- Main process bundling (entry `src/main/index.ts`)
- Preload script bundling (entry `src/preload/index.ts`)
- Renderer process bundling (root `src/renderer/`, React, TanStack Router, Tailwind)

Packaging is handled by **electron-builder** with configuration in [electron-builder.yml](electron-builder.yml):

- ASAR packaging with integrity validation
- Electron Fuses for security hardening
- Platform-specific targets: NSIS (Windows), ZIP (macOS), DEB/RPM (Linux)
- Private GitHub repository auto-updates

### Auto-Updates & Private Repos

This starter supports auto-updates from **private GitHub repositories**:

1. **Set repository to private** in `electron-builder.yml`:

   ```yaml
   publish:
     provider: github
     owner: your-username
     repo: your-repo
     private: true
   ```

2. **Create GitHub token** (Fine-grained PAT):
   - Permissions: Contents (Read/Write), Metadata (Read-only)
   - Add to `.env`: `GITHUB_TOKEN=github_pat_...` or `GH_TOKEN=github_pat_...` (both supported)

3. **How it works**:
   - Dev: Reads `GITHUB_TOKEN` or `GH_TOKEN` from `.env`
   - Production: Uses bundled `update-config.json` (created by CI)
   - Feed configuration lives in `src/main/integrations/updater/auto-updater.ts`

4. **Windows installer**: Uses NSIS (not Squirrel) for better icon support and single update mechanism

## Documentation

- **[.context/STARTER_GUIDE.md](.context/STARTER_GUIDE.md)** - Comprehensive guide with examples
- **[.context/PROJECT_BRIEF.md](.context/PROJECT_BRIEF.md)** - Project specification template
- **[.context/UI_UX_SPEC.md](.context/UI_UX_SPEC.md)** - Design specification template
- **[.context/IMPLEMENTATION_PLAN.md](.context/IMPLEMENTATION_PLAN.md)** - Development roadmap template
