# Electron Starter Guide

This comprehensive guide teaches AI assistants (and developers) how to work with this Electron boilerplate. It covers the architecture, patterns, and step-by-step instructions for common tasks.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [The IPC System (oRPC)](#the-ipc-system-orpc)
4. [Adding New IPC Handlers](#adding-new-ipc-handlers)
5. [Routing with TanStack Router](#routing-with-tanstack-router)
6. [UI Components (shadcn/ui)](#ui-components-shadcnui)
7. [Theme System](#theme-system)
8. [Auto-Updates](#auto-updates)
9. [Building and Releasing](#building-and-releasing)
10. [Common Patterns](#common-patterns)

---

## Architecture Overview

This is a modern Electron desktop application built with:

| Layer        | Technology                 | Purpose                                     |
| ------------ | -------------------------- | ------------------------------------------- |
| Framework    | Electron 44                | Desktop app shell                           |
| Build        | electron-vite + Vite 8     | Unified build system for all processes      |
| Packaging    | electron-builder           | Multi-platform installers with ASAR/fuses   |
| UI           | React 19 + TypeScript      | Component-based UI                          |
| Styling      | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with pre-built components |
| Routing      | TanStack Router            | Type-safe file-based routing                |
| Server state | TanStack Query             | Query/mutation hooks wrapping IPC actions   |
| IPC          | oRPC                       | Type-safe main↔renderer communication       |
| Updates      | electron-updater           | Auto-updates from GitHub Releases           |

### Process Model

Electron apps have two processes that communicate via IPC:

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN PROCESS                            │
│  (Node.js - full system access)                             │
│                                                             │
│  src/main/index.ts              - App lifecycle bootstrap   │
│  src/main/windows/main-window.ts - BrowserWindow factory    │
│  src/main/core/rpc-server.ts    - oRPC server endpoint      │
│  src/main/core/*/handlers.ts    - Business logic (theme,    │
│                                   window, app, shell)       │
│  src/main/integrations/updater/ - electron-updater wiring   │
└─────────────────────────────────────────────────────────────┘
                          ↕ MessagePort (oRPC)
┌─────────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                          │
│  (Browser - sandboxed, runs React)                          │
│                                                             │
│  src/renderer/app.tsx           - Root providers            │
│  src/renderer/lib/ipc-client.ts - oRPC client               │
│  src/renderer/features/*/       - Feature modules (actions, │
│                                   queries, components)      │
│  src/renderer/routes/*.tsx      - Page components           │
│  src/renderer/components/       - Generic UI components     │
└─────────────────────────────────────────────────────────────┘
                          ↕ contextBridge
┌─────────────────────────────────────────────────────────────┐
│                    PRELOAD SCRIPT                           │
│  (Bridge between main and renderer)                         │
│                                                             │
│  src/preload/index.ts - Exposes safe APIs to renderer       │
└─────────────────────────────────────────────────────────────┘
```

Cross-process types and constants (IPC channel names, updater types) live in
`src/shared/`, which imports nothing from any process.

### Enforced Boundaries

The `src/` layout is physically split by Electron process, and the rules are
**enforced by ESLint** (`eslint-plugin-boundaries` + `eslint-plugin-check-file`)
— illegal imports and wrongly named files are lint **errors**, not suggestions:

- `main`, `preload`, and `renderer` may not import each other; all three may
  import `shared`. One exception: the renderer may import the main router **as
  a type only** (`import type { router } from "@main/core/router"` in
  `src/renderer/lib/ipc-client.ts`).
- `components/ui/` (vendored shadcn) may only import other ui components and
  `utils`/`hooks`.
- `features/` may never import `routes/` — routes compose features, never the
  reverse.
- All files and folders in `src/` are **kebab-case** (routes exempt: TanStack
  needs `__root.tsx`).

TypeScript is split the same way: the root `tsconfig.json` is solution-style
and only references the three per-process configs (`src/main/tsconfig.json`,
`src/preload/tsconfig.json`, `src/renderer/tsconfig.json`, all sharing
`src/tsconfig.base.json`). `pnpm run type-check` runs all three.

---

## Project Structure

```
electron-starter/
├── .context/                    # AI assistant documentation
│   ├── STARTER_GUIDE.md        # This file
│   ├── PROJECT_BRIEF.md        # Your project specification
│   ├── UI_UX_SPEC.md           # Design specifications
│   └── IMPLEMENTATION_PLAN.md  # Development roadmap
├── assets/
│   └── icons/                  # App icons (icon.svg → generated formats)
├── scripts/
│   ├── init.mjs                # Project setup wizard
│   ├── new-feature.mjs         # Feature module scaffolder (pnpm new:feature)
│   ├── generate-icons.mjs      # SVG to multi-format icon generator
│   └── bump-shadcn-components.ts # Update shadcn/ui components
├── src/
│   ├── main/                   # Main process ("the server")
│   │   ├── index.ts            # Bootstrap only: app lifecycle wiring
│   │   ├── core/               # oRPC IPC system
│   │   │   ├── router.ts       # Aggregates all domain routers
│   │   │   ├── rpc-server.ts   # MessagePort handshake + RPCHandler
│   │   │   ├── context.ts      # Per-request window context middleware
│   │   │   ├── theme/          # Theme handlers (handlers.ts, schemas.ts, index.ts)
│   │   │   ├── window/         # Window control handlers
│   │   │   ├── app/            # App info handlers
│   │   │   └── shell/          # External link handlers
│   │   ├── integrations/
│   │   │   └── updater/        # electron-updater: auto-updater.ts + handlers
│   │   ├── windows/
│   │   │   └── main-window.ts  # BrowserWindow factory
│   │   └── common/
│   │       └── env.ts          # dotenv loading
│   ├── preload/
│   │   ├── index.ts            # contextBridge (security bridge)
│   │   └── index.d.ts          # Types for the exposed window API
│   ├── renderer/               # Renderer process ("the client")
│   │   ├── index.html          # Vite entry point
│   │   ├── index.tsx           # React entry
│   │   ├── app.tsx             # Root providers (Query, Theme, Router)
│   │   ├── features/           # Feature modules — the default home for new code
│   │   │   ├── home/           # Welcome page cards
│   │   │   ├── theme/          # Theme actions + types
│   │   │   ├── window/         # Window control actions
│   │   │   ├── shell/          # External link actions
│   │   │   ├── app/            # Version/platform actions + queries
│   │   │   └── updater/        # Update-notification UI + hooks
│   │   ├── routes/             # TanStack Router pages
│   │   │   ├── __root.tsx      # Root layout
│   │   │   └── index.tsx       # Home page (/)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components (DO NOT MODIFY)
│   │   │   ├── shared/         # Generic reusable components
│   │   │   │   ├── drag-window-region.tsx
│   │   │   │   ├── external-link.tsx
│   │   │   │   └── index.ts    # Barrel export
│   │   │   └── layouts/
│   │   │       └── base-layout.tsx # App shell with title bar
│   │   ├── lib/
│   │   │   ├── ipc-client.ts   # Client-side oRPC manager
│   │   │   ├── query-client.ts # TanStack Query client
│   │   │   ├── router.ts       # Router instance
│   │   │   └── constants.ts    # localStorage keys
│   │   ├── hooks/              # shadcn support (use-mobile)
│   │   ├── utils/              # shadcn support (tailwind.ts → cn)
│   │   └── styles/
│   │       └── global.css      # Tailwind + design tokens
│   ├── shared/                 # Cross-process code; imports NOTHING
│   │   ├── constants.ts        # IPC_CHANNELS, UPDATE_CHANNELS
│   │   └── types/updater.ts    # Updater types
│   └── tsconfig.base.json      # Shared TS settings for all processes
├── electron.vite.config.ts     # Unified Vite config (main/preload/renderer)
├── electron-builder.yml        # Packaging targets + publish settings
├── tsconfig.json               # Solution-style TS config (references only)
├── package.json                # Dependencies and scripts
└── CLAUDE.md                   # AI assistant quick reference
```

Each feature module follows the same taxonomy:

```
src/renderer/features/<feature>/
├── actions/    # <feature>-actions.ts — typed IPC calls (only layer that touches the ipc client)
├── queries/    # <feature>-queries.ts — TanStack Query hooks wrapping actions
├── components/ # Feature-owned React components
├── hooks/      # Feature-owned hooks
├── types/      # <feature>.types.ts
└── index.ts    # Public API barrel — import features through this
```

---

## The IPC System (oRPC)

The boilerplate uses [oRPC](https://orpc.dev/) for type-safe communication between the main and renderer processes. This replaces the traditional `ipcMain.handle`/`ipcRenderer.invoke` pattern with a fully typed RPC system.

### How It Works

1. **Renderer creates MessageChannel** → `src/renderer/lib/ipc-client.ts`
2. **Sends one port to main process** → via `window.postMessage`
3. **Main process starts oRPC server** → `src/main/index.ts` → `src/main/core/rpc-server.ts`
4. **Renderer calls methods** → `ipc.client.domain.method()`
5. **Main process executes handler** → `src/main/core/<domain>/handlers.ts`
6. **Response flows back** → fully typed

Type safety across the boundary comes from a single type-only import: the
renderer's ipc client imports the main router **as a type only**
(`import type { router } from "@main/core/router"`) — no runtime main-process
code ever reaches the renderer bundle.

### Calling IPC from React Components

```typescript
// Option 1: Use a feature's action wrappers (recommended)
import { toggleTheme } from "@/features/theme";
// Option 2: Direct IPC client access (only inside feature actions)
import { ipc } from "@/lib/ipc-client";

await toggleTheme();

const version = await ipc.client.app.appVersion();
```

Data flows one way inside a feature: components → queries → actions →
`lib/ipc-client`. Components never call `ipc.client` directly.

### Available IPC Domains

| Domain    | Methods                                                                    | Purpose              |
| --------- | -------------------------------------------------------------------------- | -------------------- |
| `theme`   | `getCurrentThemeMode()`, `setThemeMode(mode)`, `toggleThemeMode()`         | Theme management     |
| `window`  | `minimizeWindow()`, `maximizeWindow()`, `closeWindow()`                    | Window controls      |
| `app`     | `currentPlatform()`, `appVersion()`                                        | App info             |
| `shell`   | `openExternalLink(url)`                                                    | Open URLs in browser |
| `updater` | `checkForUpdates()`, `downloadUpdate()`, `installUpdate()`, `isPortable()` | Auto-updates         |

Core domains live in `src/main/core/<domain>/`; the `updater` domain wraps an
external system, so it lives in `src/main/integrations/updater/` instead.

---

## Adding New IPC Handlers

Follow this pattern to add new IPC functionality.

> **Shortcut**: `pnpm new:feature <kebab-name>` scaffolds everything below —
> the `src/main/core/<name>/` domain (handlers + schemas), the
> `src/renderer/features/<name>/` module (actions/queries/types taxonomy) —
> and auto-wires the domain into `src/main/core/router.ts`. The manual steps
> are still worth understanding:

### Step 1: Create Handler Files

Create a new domain folder in `src/main/core/`:

```
src/main/core/database/
├── handlers.ts   # Handler implementations
├── schemas.ts    # Zod input schemas (if needed)
└── index.ts      # Export aggregation
```

### Step 2: Implement Handlers

```typescript
// src/main/core/database/handlers.ts
import { os } from "@orpc/server";
import { z } from "zod";

// Handler with context (access to BrowserWindow)
import { ipcContext } from "../context";

// Simple handler (no input)
export const getAllRecords = os.handler(async () => {
  // Access Node.js APIs, databases, file system, etc.
  return [{ id: 1, name: "Example" }];
});

// Handler with input validation
export const createRecord = os
  .input(z.object({ name: z.string().min(1) }))
  .handler(async ({ input }) => {
    // input is typed as { name: string }
    return { id: Date.now(), name: input.name };
  });

export const showNotification = os
  .use(ipcContext.mainWindowContext)
  .input(z.object({ message: z.string() }))
  .handler(async ({ input, context }) => {
    const { window } = context;
    // Use window for notifications, dialogs, etc.
    return true;
  });
```

### Step 3: Create Index Export

```typescript
// src/main/core/database/index.ts
import { createRecord, getAllRecords, showNotification } from "./handlers";

export const database = {
  getAllRecords,
  createRecord,
  showNotification,
};
```

### Step 4: Add to Router

```typescript
// src/main/core/router.ts
import { database } from "./database";

export const router = {
  theme,
  window,
  app,
  shell,
  updater,
  database, // Add new domain
};
```

### Step 5: Create Action Wrappers in a Feature

Renderer-side code lives in a feature module. Actions are the only layer that
touches the ipc client:

```typescript
// src/renderer/features/records/actions/records-actions.ts
import { ipc } from "@/lib/ipc-client";

export async function getAllRecords() {
  return ipc.client.database.getAllRecords();
}

export async function createRecord(name: string) {
  return ipc.client.database.createRecord({ name });
}
```

### Step 6: Wrap Actions in TanStack Query Hooks

```typescript
// src/renderer/features/records/queries/records-queries.ts
import { useQuery } from "@tanstack/react-query";

import { getAllRecords } from "../actions/records-actions";

export function useRecordsQuery() {
  return useQuery({
    queryKey: ["records"],
    queryFn: getAllRecords,
  });
}
```

Export the feature's public API through its barrel
(`src/renderer/features/records/index.ts`).

### Step 7: Use the Hook in a Route

```typescript
// src/renderer/routes/records.tsx
import { useRecordsQuery, createRecord } from "@/features/records";

function RecordsPage() {
  const { data: records, refetch } = useRecordsQuery();

  const handleCreate = async () => {
    await createRecord("New Item");
    await refetch();
  };

  return (/* ... */);
}
```

---

## Routing with TanStack Router

This boilerplate uses [TanStack Router](https://tanstack.com/router) with file-based routing.

### Creating a New Route

1. Create a file in `src/renderer/routes/`:

```typescript
// src/renderer/routes/settings.tsx
import { createFileRoute } from "@tanstack/react-router";

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      {/* Your content */}
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
```

2. The route tree is auto-generated to `src/renderer/routeTree.gen.ts`

Keep routes thin: they compose feature modules (`@/features/<feature>`), and
features never import routes.

### Route File Naming

| File                | Route                          |
| ------------------- | ------------------------------ |
| `index.tsx`         | `/`                            |
| `settings.tsx`      | `/settings`                    |
| `users/index.tsx`   | `/users`                       |
| `users/$userId.tsx` | `/users/:userId` (dynamic)     |
| `__root.tsx`        | Root layout (wraps all routes) |

### Navigation

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

// Declarative navigation
<Link to="/settings">Go to Settings</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate({ to: "/settings" });
```

### Accessing Route Parameters

```typescript
// src/renderer/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  return <div>User ID: {userId}</div>;
}
```

---

## UI Components (shadcn/ui)

The boilerplate includes the full [shadcn/ui](https://ui.shadcn.com/) registry, pre-installed in `src/renderer/components/ui/`.

### Available Components

- **Layout & navigation**: Card, Separator, Tabs, Accordion, Collapsible, ScrollArea, Resizable, Sidebar, NavigationMenu, Breadcrumb, Pagination
- **Forms**: Button, Input, Textarea, Label, Select, Checkbox, RadioGroup, Switch, Slider, Combobox, Field, Toggle, DatePicker, NumberInput
- **Feedback**: Alert, Badge, Progress, Skeleton, Spinner, Sonner (toasts)
- **Overlays**: Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, Command, DropdownMenu, ContextMenu
- **Data Entry & display**: Calendar, InputGroup, Table, Chart, Carousel, Avatar

Check `src/renderer/components/ui/` before hand-rolling any primitive — if a
component exists there, use it.

### Using Components

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter text..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Adding New Components

```bash
npx shadcn@latest add checkbox
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
```

### Updating All Components

```bash
pnpm run bump-shadcn-components
```

---

## Component Organization

Pages should be lightweight and composed primarily of components. The renderer
is organized **feature-first**: components belong to the feature that owns
them, not to the page that happens to render them.

### Directory Structure

```
src/renderer/
├── features/
│   ├── settings/               # Feature module
│   │   ├── components/         # Feature-owned components
│   │   │   ├── settings-form.tsx
│   │   │   └── theme-selector.tsx
│   │   ├── actions/  queries/  hooks/  types/
│   │   └── index.ts            # Public API barrel
│   └── dashboard/
│       ├── components/
│       │   ├── stats-card.tsx
│       │   └── activity-feed.tsx
│       └── index.ts
└── components/
    ├── ui/                     # shadcn/ui primitives (DO NOT MODIFY)
    │   ├── button.tsx
    │   ├── card.tsx
    │   └── ...
    ├── shared/                 # Generic components used by 2+ features
    │   ├── drag-window-region.tsx
    │   ├── external-link.tsx
    │   └── index.ts
    └── layouts/
        └── base-layout.tsx     # App shell with title bar
```

### Organization Rules

1. **Feature-owned components** go in `src/renderer/features/<feature>/components/`
   - Belong to one feature (e.g., `settings/components/` for the settings feature)
   - Exported through the feature's public `index.ts` barrel — other code
     imports `@/features/<feature>`, never a feature's internal files

2. **Generic reusable components** go in `src/renderer/components/shared/`
   - Used by 2+ features
   - No feature-specific logic; generic, reusable functionality

3. **shadcn/ui components** stay in `src/renderer/components/ui/`
   - Vendored — never hand-edit these; they are regenerated by the shadcn CLI
     (`pnpm run bump-shadcn-components`)
   - Lint enforces that `ui/` only imports other ui components and `utils`/`hooks`

### When to Create a Component

Extract code into a component when:

- A section of JSX exceeds ~50 lines
- Logic/UI is repeated across the page
- A distinct piece of functionality can be named and isolated
- Testing a piece of UI in isolation would be valuable

### Example: Well-Organized Page

```typescript
// src/renderer/routes/settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm, ThemeSelector, DangerZone } from "@/features/settings";
import { PageHeader } from "@/components/shared/page-header";

function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your application preferences"
      />
      <SettingsForm />
      <ThemeSelector />
      <DangerZone />
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
```

### Example: Feature Barrel Export

Every feature has a public `index.ts` barrel that re-exports what other code
may use:

```typescript
// src/renderer/features/settings/index.ts
export { SettingsForm } from "./components/settings-form";
export { ThemeSelector } from "./components/theme-selector";
export { DangerZone } from "./components/danger-zone";
```

Then import cleanly:

```typescript
import { DangerZone, SettingsForm, ThemeSelector } from "@/features/settings";
```

### Promoting Components Between Scopes

When a second feature needs a component that a feature owns:

1. Promote it from `src/renderer/features/<feature>/components/` to
   `src/renderer/components/shared/`
2. Update all imports
3. Consider if it needs to be made more generic (props, configuration) —
   anything in `shared/` should carry no feature-specific logic

### Anti-Patterns to Avoid

❌ **Bloated pages** - Pages with hundreds of lines of inline JSX

```typescript
// BAD: Everything inline in the page
function SettingsPage() {
  return (
    <div>
      {/* 200 lines of forms, buttons, logic... */}
    </div>
  );
}
```

❌ **Flat component directory** - All components in one folder

```
// BAD: No organization
src/renderer/components/
├── button.tsx
├── settings-form.tsx
├── dashboard-stats.tsx
├── user-avatar.tsx
└── ... (50+ files)
```

❌ **Modifying shadcn/ui components** - Changes get overwritten on update

```typescript
// BAD: Editing ui/button.tsx directly
// Instead, create a wrapper in shared/ if needed
```

✅ **Thin pages, rich components** - Pages orchestrate, components implement

---

## Theme System

The app supports light and dark themes with system preference detection.

### How Theming Works

1. **CSS Variables** in `src/renderer/styles/global.css` define colors for light/dark modes
2. **Electron's nativeTheme** controls the actual theme
3. **localStorage** persists user preference
4. **Document class** (`dark`) toggles Tailwind dark mode

### Using Theme in Components

```typescript
// Toggle theme
import { toggleTheme } from "@/features/theme";
<Button onClick={toggleTheme}>Toggle Theme</Button>

// Get current theme
import { getCurrentTheme } from "@/features/theme";
const { system, local } = await getCurrentTheme();
```

### Tailwind Dark Mode Classes

```typescript
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Muted text</p>
  <div className="bg-card border-border">Card content</div>
</div>
```

The theme automatically uses the correct color values based on the current mode.

---

## Auto-Updates

The boilerplate includes a complete auto-update system via `electron-updater`.

### How It Works

1. App checks GitHub Releases on startup (3-second delay)
2. If update available, shows notification in bottom-right corner
3. User can download and install with one click
4. App restarts with new version

### Configuration

In `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: your-username
  repo: your-repo
  private: true # Set to true for private repositories
```

### Private Repository Setup

For private GitHub repositories, you need to configure a GitHub token:

#### 1. Create a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - Token name: your-app-updater
   - Repository access: Only select repositories → Select your repo
   - Permissions:
     - Contents: Read and write
     - Metadata: Read-only (auto-selected)

#### 2. Add Token to Local .env

Create a `.env` file (copy from `.env.example`) and add:

```bash
GITHUB_TOKEN=github_pat_11AU47ZII0...your_token_here
# or use GH_TOKEN (both are supported)
```

#### 3. How It Works

- **Development**: App reads `GITHUB_TOKEN` or `GH_TOKEN` from `.env` file
- **Production (CI/CD)**:
  - GitHub Actions creates `update-config.json` with `GITHUB_TOKEN`
  - electron-builder bundles it via `extraResources`
  - App reads token from resources folder at runtime
  - electron-updater checks for updates using the bundled token

The token handling and feed configuration are implemented in `src/main/integrations/updater/auto-updater.ts`:

```typescript
// Get GitHub token for private repo updates
function getUpdateToken(): string {
  // Development: use .env file (loaded by dotenv)
  // Check both GH_TOKEN and GITHUB_TOKEN for flexibility
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    return token;
  }

  // Production: use bundled config file (created during build/CI)
  const configPath = path.join(process.resourcesPath, "update-config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      return config.token || "";
    } catch (err) {
      console.error("[AutoUpdater] Failed to read update config:", err);
    }
  }

  return "";
}
```

### Update Handlers

```typescript
// Use the updater feature's actions
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
} from "@/features/updater";

// Check for updates manually
await checkForUpdates();

// Download update
await downloadUpdate();

// Install and restart
await installUpdate();
```

The main-process handlers live in `src/main/integrations/updater/handlers.ts`;
one-way progress events flow main → renderer via `webContents.send` and the
`contextBridge` API in `src/preload/index.ts` (channel names in
`src/shared/constants.ts`). The update-notification UI lives in
`src/renderer/features/updater/`.

---

## Building and Releasing

### Development

```bash
pnpm run dev            # Start with hot reload
pnpm run start          # Alias for dev
pnpm run build          # Build for production
```

### Code Quality

```bash
pnpm run lint           # ESLint (includes boundary + naming rules)
pnpm run type-check     # Type-check all three processes (main, preload, renderer)
pnpm run format         # Prettier
```

### Building

```bash
pnpm run package        # Package without creating installer
pnpm run make           # Create distributable installers
pnpm run make:win       # Windows only (NSIS)
pnpm run make:mac       # macOS only (ZIP)
pnpm run make:linux     # Linux only (DEB, RPM)
```

### Build Configuration

The project uses **electron-vite** for building with a unified configuration in `electron.vite.config.ts`:

- **Main process**: Bundled from `src/main/index.ts` to `dist/main/index.js`
- **Preload script**: Bundled from `src/preload/index.ts` to `dist/preload/index.js`
- **Renderer process**: Rooted at `src/renderer/` (its `index.html` is the entry), bundled to `dist/renderer/` with React, TanStack Router, and Tailwind

Packaging is handled by **electron-builder** with configuration in:

- `package.json` → `build` field (ASAR, files, fuses, publish settings)
- `electron-builder.yml` → Platform-specific targets and extra resources

**Security Features**:

- ✅ ASAR packaging with integrity validation
- ✅ Electron Fuses (runAsNode disabled, cookie encryption, etc.)
- ✅ Context isolation and sandboxing

**Windows Installer**:

- Uses NSIS (not Squirrel.Windows) for better reliability
- ✅ No ENOENT errors (no dependency on app-update.yml)
- ✅ Proper custom icon support
- ✅ Single update mechanism via electron-updater
- ✅ NSIS installer with directory selection

### Releasing

```bash
pnpm run release        # Interactive version bump + changelog
pnpm run release:patch  # 0.1.0 → 0.1.1
pnpm run release:minor  # 0.1.0 → 0.2.0
pnpm run release:major  # 0.1.0 → 1.0.0
```

The release process:

1. Runs lint and type-check
2. Bumps version in package.json
3. Generates CHANGELOG.md from commits
4. Creates git tag
5. Pushes to GitHub
6. GitHub Actions builds and publishes

---

## Common Patterns

### Opening External Links

Never open external URLs directly. Use the shell action:

```typescript
import { openExternalLink } from "@/features/shell";
await openExternalLink("https://example.com");

// Or use the ExternalLink component
import { ExternalLink } from "@/components/shared/external-link";
<ExternalLink href="https://example.com">Visit Site</ExternalLink>
```

### Toast Notifications

```typescript
import { toast } from "sonner";

toast.success("Operation completed!");
toast.error("Something went wrong");
toast.loading("Processing...");
```

### Window Controls

```typescript
import { minimizeWindow, maximizeWindow, closeWindow } from "@/features/window";

<Button onClick={minimizeWindow}>-</Button>
<Button onClick={maximizeWindow}>□</Button>
<Button onClick={closeWindow}>×</Button>
```

### Path Aliases

| Alias       | Target          | Available in                 |
| ----------- | --------------- | ---------------------------- |
| `@/*`       | `src/renderer/` | renderer                     |
| `@main/*`   | `src/main/`     | main (+ renderer, type-only) |
| `@shared/*` | `src/shared/`   | all processes                |

```typescript
import { UPDATE_CHANNELS } from "@shared/constants";

import { Button } from "@/components/ui/button";
import { toggleTheme } from "@/features/theme";
import { ipc } from "@/lib/ipc-client";
```

The renderer may only use `@main/*` for the type-only router import in
`lib/ipc-client.ts` — anything else is a lint error.

### Getting App Info

```typescript
import { getPlatform, getAppVersion } from "@/features/app";

const platform = await getPlatform(); // "win32" | "darwin" | "linux"
const version = await getAppVersion(); // "0.1.0"

// Or use the TanStack Query hooks in components
import { usePlatformQuery, useAppVersionQuery } from "@/features/app";
const { data: version } = useAppVersionQuery();
```

---

## Environment Variables

The boilerplate includes [dotenv](https://github.com/motdotla/dotenv) for environment variable management.

### Setup

1. Copy the example file to create your local `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values (this file is gitignored)

### Usage

Environment variables are automatically loaded in the main process (dotenv
loading lives in `src/main/common/env.ts`). Access them via `process.env`:

```typescript
// In any main process code (src/main/**)
const apiKey = process.env.API_KEY;
const debugMode = process.env.DEBUG === "true";
```

### Available in .env.example

```env
# API_KEY=your-api-key-here
# DATABASE_URL=sqlite://./data.db
# DEBUG=false
# GH_TOKEN=your-github-personal-access-token
```

### Important Notes

- `.env` files are gitignored and should never be committed
- `.env.example` serves as documentation for required variables
- In CI/CD, the workflow copies `.env.example` to `.env` automatically
- For renderer process access, expose values through IPC handlers

---

## Quick Reference

### File Locations by Task

| Task                | Files to Modify                                                      |
| ------------------- | -------------------------------------------------------------------- |
| Add new page        | `src/renderer/routes/<name>.tsx`                                     |
| Add a feature       | `pnpm new:feature <name>` (scaffolds main domain + renderer feature) |
| Add IPC handler     | `src/main/core/<domain>/handlers.ts`, `src/main/core/router.ts`      |
| Add UI component    | `npx shadcn@latest add <component>`                                  |
| Modify theme colors | `src/renderer/styles/global.css`                                     |
| Change app icon     | `assets/icons/icon.svg` → `pnpm run generate-icons`                  |
| Configure app       | `pnpm run init-project`                                              |

### Common Commands

```bash
pnpm run start              # Development
pnpm run lint               # Check code (boundaries + naming included)
pnpm run type-check         # Type-check main, preload, and renderer
pnpm run format             # Format code
pnpm run make               # Build installer
pnpm run release            # Version bump + release
pnpm new:feature <name>     # Scaffold a feature module (main + renderer)
pnpm run bump-shadcn-components  # Update UI library
pnpm run generate-icons     # Regenerate icons
pnpm run init-project       # Setup wizard
```
