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

| Layer     | Technology                 | Purpose                                     |
| --------- | -------------------------- | ------------------------------------------- |
| Framework | Electron 39                | Desktop app shell                           |
| Build     | electron-vite + Vite 7     | Unified build system for all processes      |
| Packaging | electron-builder           | Multi-platform installers with ASAR/fuses   |
| UI        | React 19 + TypeScript      | Component-based UI                          |
| Styling   | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with pre-built components |
| Routing   | TanStack Router            | Type-safe file-based routing                |
| IPC       | oRPC                       | Type-safe main↔renderer communication       |
| Updates   | electron-updater           | Auto-updates from GitHub Releases           |

### Process Model

Electron apps have two processes that communicate via IPC:

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN PROCESS                            │
│  (Node.js - full system access)                             │
│                                                             │
│  src/main.ts          - App lifecycle, window creation      │
│  src/ipc/handler.ts   - oRPC server endpoint                │
│  src/ipc/*/handlers.ts - Business logic (theme, window, etc)│
└─────────────────────────────────────────────────────────────┘
                          ↕ MessagePort (oRPC)
┌─────────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                          │
│  (Browser - sandboxed, runs React)                          │
│                                                             │
│  src/App.tsx          - React app entry                     │
│  src/ipc/manager.ts   - oRPC client                         │
│  src/actions/*.ts     - IPC wrapper functions               │
│  src/routes/*.tsx     - Page components                     │
│  src/components/*.tsx - UI components                       │
└─────────────────────────────────────────────────────────────┘
                          ↕ contextBridge
┌─────────────────────────────────────────────────────────────┐
│                    PRELOAD SCRIPT                           │
│  (Bridge between main and renderer)                         │
│                                                             │
│  src/preload.ts       - Exposes safe APIs to renderer       │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
electron-boilerplate/
├── .context/                    # AI assistant documentation
│   ├── STARTER_GUIDE.md        # This file
│   ├── PROJECT_BRIEF.md        # Your project specification
│   ├── UI_UX_SPEC.md           # Design specifications
│   └── IMPLEMENTATION_PLAN.md  # Development roadmap
├── assets/
│   └── icons/                  # App icons (icon.svg → generated formats)
├── scripts/
│   ├── init.mjs                # Project setup wizard
│   ├── generate-icons.mjs      # SVG to multi-format icon generator
│   └── bump-shadcn-components.ts # Update shadcn/ui components
├── src/
│   ├── main.ts                 # Electron main process entry
│   ├── preload.ts              # Preload script (security bridge)
│   ├── renderer.ts             # Renderer process entry
│   ├── App.tsx                 # React app root
│   ├── actions/                # Renderer-side IPC wrappers
│   │   ├── theme.ts            # Theme actions
│   │   ├── window.ts           # Window control actions
│   │   ├── shell.ts            # Shell/external link actions
│   │   └── app.ts              # App info actions
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (DO NOT MODIFY)
│   │   ├── shared/             # Shared components (used across pages)
│   │   │   ├── drag-window-region.tsx
│   │   │   ├── external-link.tsx
│   │   │   ├── update-notification.tsx
│   │   │   └── index.ts        # Barrel export
│   │   └── home/               # Home page components
│   │       ├── hero-section.tsx
│   │       ├── quick-start-card.tsx
│   │       ├── features-grid.tsx
│   │       ├── scripts-card.tsx
│   │       ├── customization-card.tsx
│   │       ├── ai-section-card.tsx
│   │       └── index.ts        # Barrel export
│   ├── constants/
│   │   └── index.ts            # IPC channels, localStorage keys
│   ├── ipc/                    # IPC system
│   │   ├── manager.ts          # Client-side oRPC manager
│   │   ├── handler.ts          # Server-side oRPC handler
│   │   ├── router.ts           # Aggregates all handlers
│   │   ├── context.ts          # Provides BrowserWindow to handlers
│   │   ├── theme/              # Theme handlers
│   │   ├── window/             # Window control handlers
│   │   ├── app/                # App info handlers
│   │   ├── shell/              # External link handlers
│   │   └── updater/            # Auto-update handlers
│   ├── layouts/
│   │   └── base-layout.tsx     # App shell with title bar
│   ├── routes/                 # TanStack Router pages
│   │   ├── __root.tsx          # Root layout
│   │   └── index.tsx           # Home page (/)
│   ├── styles/
│   │   └── global.css          # Tailwind + design tokens
│   ├── types/
│   │   └── theme-mode.ts       # Theme type definitions
│   └── utils/
│       ├── cn.ts               # Class name utility
│       └── routes.ts           # Router instance
├── forge.config.ts             # Electron Forge config
├── vite.main.config.mts        # Vite config for main process
├── vite.preload.config.mts     # Vite config for preload
├── vite.renderer.config.mts    # Vite config for renderer
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies and scripts
├── CLAUDE.md                   # AI assistant quick reference
└── index.html                  # HTML entry point
```

---

## The IPC System (oRPC)

The boilerplate uses [oRPC](https://orpc.dev/) for type-safe communication between the main and renderer processes. This replaces the traditional `ipcMain.handle`/`ipcRenderer.invoke` pattern with a fully typed RPC system.

### How It Works

1. **Renderer creates MessageChannel** → `src/ipc/manager.ts`
2. **Sends one port to main process** → via `window.postMessage`
3. **Main process starts oRPC server** → `src/main.ts` → `src/ipc/handler.ts`
4. **Renderer calls methods** → `ipc.client.domain.method()`
5. **Main process executes handler** → `src/ipc/<domain>/handlers.ts`
6. **Response flows back** → fully typed

### Calling IPC from React Components

```typescript
// Option 1: Use action wrappers (recommended)
import { toggleTheme } from "@/actions/theme";
await toggleTheme();

// Option 2: Direct IPC client access
import { ipc } from "@/ipc/manager";
const version = await ipc.client.app.appVersion();
```

### Available IPC Domains

| Domain    | Methods                                                                    | Purpose              |
| --------- | -------------------------------------------------------------------------- | -------------------- |
| `theme`   | `getCurrentThemeMode()`, `setThemeMode(mode)`, `toggleThemeMode()`         | Theme management     |
| `window`  | `minimizeWindow()`, `maximizeWindow()`, `closeWindow()`                    | Window controls      |
| `app`     | `currentPlatform()`, `appVersion()`                                        | App info             |
| `shell`   | `openExternalLink(url)`                                                    | Open URLs in browser |
| `updater` | `checkForUpdates()`, `downloadUpdate()`, `installUpdate()`, `isPortable()` | Auto-updates         |

---

## Adding New IPC Handlers

Follow this pattern to add new IPC functionality:

### Step 1: Create Handler Files

Create a new domain folder in `src/ipc/`:

```
src/ipc/database/
├── handlers.ts   # Handler implementations
├── schemas.ts    # Zod input schemas (if needed)
└── index.ts      # Export aggregation
```

### Step 2: Implement Handlers

```typescript
// src/ipc/database/handlers.ts
import { os } from "@orpc/server";
import { z } from "zod";

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

// Handler with context (access to BrowserWindow)
import { ipcContext } from "@/ipc/context";

export const showNotification = os
  .input(z.object({ message: z.string() }))
  .handler(async ({ input }) => {
    const window = ipcContext.mainWindow;
    // Use window for notifications, dialogs, etc.
    return true;
  });
```

### Step 3: Create Index Export

```typescript
// src/ipc/database/index.ts
import { getAllRecords, createRecord, showNotification } from "./handlers";

export const database = {
  getAllRecords,
  createRecord,
  showNotification,
};
```

### Step 4: Add to Router

```typescript
// src/ipc/router.ts
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

### Step 5: Create Action Wrapper (Optional but Recommended)

```typescript
// src/actions/database.ts
import { ipc } from "@/ipc/manager";

export async function getAllRecords() {
  return ipc.client.database.getAllRecords();
}

export async function createRecord(name: string) {
  return ipc.client.database.createRecord({ name });
}
```

### Step 6: Use in Components

```typescript
// src/routes/records.tsx
import { getAllRecords, createRecord } from "@/actions/database";

function RecordsPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    getAllRecords().then(setRecords);
  }, []);

  const handleCreate = async () => {
    const newRecord = await createRecord("New Item");
    setRecords((prev) => [...prev, newRecord]);
  };

  return (/* ... */);
}
```

---

## Routing with TanStack Router

This boilerplate uses [TanStack Router](https://tanstack.com/router) with file-based routing.

### Creating a New Route

1. Create a file in `src/routes/`:

```typescript
// src/routes/settings.tsx
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

2. The route tree is auto-generated to `src/routeTree.gen.ts`

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
// src/routes/users/$userId.tsx
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

The boilerplate includes 21+ [shadcn/ui](https://ui.shadcn.com/) components in `src/components/ui/`.

### Available Components

- **Layout**: Card, Separator, ScrollArea
- **Forms**: Button, Input, Textarea, Label, Select, DatePicker, NumberInput
- **Feedback**: Alert, Badge, Progress, Spinner, Sonner (toasts)
- **Overlays**: Dialog, Popover, Tooltip, Command
- **Data Entry**: Calendar, InputGroup

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

Pages should be lightweight and composed primarily of components. Organize custom components into folders based on their scope.

### Directory Structure

```
src/components/
├── ui/                     # shadcn/ui primitives (DO NOT MODIFY)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── shared/                 # Components used across multiple pages
│   ├── user-avatar.tsx
│   ├── search-bar.tsx
│   └── data-table/
│       ├── data-table.tsx
│       ├── data-table-header.tsx
│       └── index.ts
├── settings/               # Components specific to settings page
│   ├── settings-form.tsx
│   ├── theme-selector.tsx
│   └── index.ts
├── dashboard/              # Components specific to dashboard page
│   ├── stats-card.tsx
│   ├── activity-feed.tsx
│   ├── quick-actions.tsx
│   └── index.ts
└── ...
```

### Organization Rules

1. **Page-specific components** go in `src/components/<page-name>/`
   - Only used by one page
   - Named after the page's route (e.g., `settings/` for `/settings`)

2. **Shared components** go in `src/components/shared/`
   - Used by 2+ pages
   - Generic, reusable functionality

3. **shadcn/ui components** stay in `src/components/ui/`
   - Never modify these directly
   - They are managed by the shadcn CLI

### When to Create a Component

Extract code into a component when:

- A section of JSX exceeds ~50 lines
- Logic/UI is repeated across the page
- A distinct piece of functionality can be named and isolated
- Testing a piece of UI in isolation would be valuable

### Example: Well-Organized Page

```typescript
// src/routes/settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { DangerZone } from "@/components/settings/danger-zone";
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

### Example: Component with Barrel Export

For folders with multiple components, use an `index.ts` barrel file:

```typescript
// src/components/settings/index.ts
export { SettingsForm } from "./settings-form";
export { ThemeSelector } from "./theme-selector";
export { DangerZone } from "./danger-zone";
```

Then import cleanly:

```typescript
import { SettingsForm, ThemeSelector, DangerZone } from "@/components/settings";
```

### Moving Components Between Scopes

When a page-specific component needs to be used elsewhere:

1. Move it from `src/components/<page>/` to `src/components/shared/`
2. Update all imports
3. Consider if it needs to be made more generic (props, configuration)

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
src/components/
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

1. **CSS Variables** in `src/styles/global.css` define colors for light/dark modes
2. **Electron's nativeTheme** controls the actual theme
3. **localStorage** persists user preference
4. **Document class** (`dark`) toggles Tailwind dark mode

### Using Theme in Components

```typescript
// Toggle theme
import { toggleTheme } from "@/actions/theme";
<Button onClick={toggleTheme}>Toggle Theme</Button>

// Get current theme
import { getCurrentTheme } from "@/actions/theme";
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

In `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo",
      "private": true // Set to true for private repositories
    }
  }
}
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

The token handling is implemented in `src/main.ts`:

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
// Check for updates manually
import { ipc } from "@/ipc/manager";
await ipc.client.updater.checkForUpdates();

// Download update
await ipc.client.updater.downloadUpdate();

// Install and restart
await ipc.client.updater.installUpdate();
```

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
pnpm run lint           # ESLint
pnpm run format         # Prettier
```

### Building

```bash
pnpm run package        # Package without creating installer
pnpm run make           # Create distributable installers
pnpm run make:win       # Windows only (WiX MSI)
pnpm run make:mac       # macOS only (ZIP)
pnpm run make:linux     # Linux only (DEB, RPM)
```

### Build Configuration

The project uses **electron-vite** for building with a unified configuration in `electron.vite.config.ts`:

- **Main process**: Bundled from `src/main.ts` to `dist/main/index.js`
- **Preload script**: Bundled from `src/preload.ts` to `dist/preload/index.js`
- **Renderer process**: Bundled from `index.html` to `dist/renderer/` with React, TanStack Router, and Tailwind

Packaging is handled by **electron-builder** with configuration in:

- `package.json` → `build` field (ASAR, files, fuses, publish settings)
- `electron-builder.yml` → Platform-specific targets and extra resources

**Security Features**:

- ✅ ASAR packaging with integrity validation
- ✅ Electron Fuses (runAsNode disabled, cookie encryption, etc.)
- ✅ Context isolation and sandboxing

**Windows Installer**:

- Uses WiX (not Squirrel.Windows) for better reliability
- ✅ No ENOENT errors (no dependency on app-update.yml)
- ✅ Proper custom icon support
- ✅ Single update mechanism via electron-updater
- ✅ MSI installer with directory selection

### Releasing

```bash
pnpm run release        # Interactive version bump + changelog
pnpm run release:patch  # 0.1.0 → 0.1.1
pnpm run release:minor  # 0.1.0 → 0.2.0
pnpm run release:major  # 0.1.0 → 1.0.0
```

The release process:

1. Runs lint and format checks
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
import { openExternalLink } from "@/actions/shell";
await openExternalLink("https://example.com");

// Or use the ExternalLink component
import { ExternalLink } from "@/components/external-link";
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
import { minimizeWindow, maximizeWindow, closeWindow } from "@/actions/window";

<Button onClick={minimizeWindow}>-</Button>
<Button onClick={maximizeWindow}>□</Button>
<Button onClick={closeWindow}>×</Button>
```

### Path Aliases

Use `@/` to reference `src/`:

```typescript
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/manager";
import { toggleTheme } from "@/actions/theme";
```

### Getting App Info

```typescript
import { getCurrentPlatform, getAppVersion } from "@/actions/app";

const platform = await getCurrentPlatform(); // "win32" | "darwin" | "linux"
const version = await getAppVersion(); // "0.1.0"
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

Environment variables are automatically loaded in the main process. Access them via `process.env`:

```typescript
// In main process (src/main.ts or any main process code)
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

| Task                | Files to Modify                                     |
| ------------------- | --------------------------------------------------- |
| Add new page        | `src/routes/<name>.tsx`                             |
| Add IPC handler     | `src/ipc/<domain>/handlers.ts`, `src/ipc/router.ts` |
| Add UI component    | `npx shadcn@latest add <component>`                 |
| Modify theme colors | `src/styles/global.css`                             |
| Change app icon     | `assets/icons/icon.svg` → `pnpm run generate-icons` |
| Configure app       | `pnpm run init-project`                             |

### Common Commands

```bash
pnpm run start              # Development
pnpm run lint               # Check code
pnpm run format             # Format code
pnpm run make               # Build installer
pnpm run release            # Version bump + release
pnpm run bump-shadcn-components  # Update UI library
pnpm run generate-icons     # Regenerate icons
pnpm run init-project       # Setup wizard
```
