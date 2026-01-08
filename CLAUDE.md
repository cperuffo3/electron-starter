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
pnpm run lint               # ESLint check and fix
pnpm run format             # Prettier format

# Package & Distribute
pnpm run package            # Package without creating installer
pnpm run make               # Create distributable installers
pnpm run make:win           # Windows only (WiX MSI)
pnpm run make:mac           # macOS only (ZIP)
pnpm run make:linux         # Linux only (DEB, RPM)

# Release
pnpm run release            # Interactive version bump + changelog
pnpm run release:patch      # Bump patch version (0.1.0 → 0.1.1)

# Utilities
pnpm run init-project       # Project setup wizard
pnpm run generate-icons     # Generate icons from assets/icons/icon.svg
pnpm run bump-shadcn-components  # Update shadcn/ui components
```

### Tech Stack

| Layer     | Technology                            |
| --------- | ------------------------------------- |
| Framework | Electron 39 + electron-vite           |
| Build     | Vite 7 (via electron-vite)            |
| Packaging | electron-builder                      |
| UI        | React 19 + TypeScript 5.9             |
| Styling   | Tailwind CSS 4 + shadcn/ui            |
| Routing   | TanStack Router (file-based)          |
| IPC       | oRPC (type-safe RPC over MessagePort) |
| Updates   | electron-updater (GitHub Releases)    |
| Env Vars  | dotenv (.env files)                   |

### Styling Rules

**ALWAYS use Tailwind CSS classes for all styling. NEVER use:**

- Inline styles (`style={{ }}`)
- Custom CSS files or `<style>` tags
- Hardcoded color values (hex, rgb, hsl)
- CSS-in-JS solutions

**Use Tailwind's design system:**

- Colors: `bg-primary`, `text-muted-foreground`, `border-border`, etc.
- Spacing: `p-4`, `mt-2`, `gap-3`, etc.
- Typography: `text-sm`, `font-medium`, etc.
- Use CSS variables from the theme via Tailwind classes (e.g., `bg-background`, `text-foreground`)

### Architecture

```
Main Process (src/main.ts)
    ↕ oRPC over MessagePort
Renderer Process (src/App.tsx)
    ↕ contextBridge
Preload Script (src/preload.ts)
```

### Key Directories

| Path                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `src/ipc/`           | IPC handlers (theme, window, app, shell, updater) |
| `src/actions/`       | Renderer-side IPC wrapper functions               |
| `src/routes/`        | TanStack Router pages (file-based)                |
| `src/components/ui/` | shadcn/ui components (21+ included)               |
| `src/layouts/`       | Layout components (BaseLayout with title bar)     |
| `.context/`          | AI assistant documentation                        |
| `.env.example`       | Environment variable template                     |

### IPC Pattern

```typescript
// 1. Handler (src/ipc/<domain>/handlers.ts)
export const myHandler = os.input(z.object({ name: z.string() }))
  .handler(({ input }) => { /* main process code */ });

// 2. Add to router (src/ipc/router.ts)
export const router = { ..., myDomain };

// 3. Action wrapper (src/actions/<domain>.ts)
export const myAction = (name: string) => ipc.client.myDomain.myHandler({ name });

// 4. Use in component
await myAction("value");
```

### Adding Routes

Create `src/routes/<name>.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/<name>")({
  component: () => <div>My Page</div>,
});
```

### Path Alias

`@/*` → `./src/*`

```typescript
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/manager";
```

### Build Configuration

The project uses **electron-vite** for building with a unified [electron.vite.config.ts](electron.vite.config.ts) configuration that handles:

- Main process bundling
- Preload script bundling
- Renderer process bundling (React, TanStack Router, Tailwind)

Packaging is handled by **electron-builder** with configuration in [package.json](package.json:30-58) and [electron-builder.yml](electron-builder.yml):

- ASAR packaging with integrity validation
- Electron Fuses for security hardening
- Platform-specific targets: WiX (Windows), ZIP (macOS), DEB/RPM (Linux)
- Private GitHub repository auto-updates

### Auto-Updates & Private Repos

This starter supports auto-updates from **private GitHub repositories**:

1. **Set repository to private** in `package.json`:

   ```json
   "build": {
     "publish": {
       "provider": "github",
       "owner": "your-username",
       "repo": "your-repo",
       "private": true
     }
   }
   ```

2. **Create GitHub token** (Fine-grained PAT):
   - Permissions: Contents (Read/Write), Metadata (Read-only)
   - Add to `.env`: `GITHUB_TOKEN=github_pat_...` or `GH_TOKEN=github_pat_...` (both supported)

3. **How it works**:
   - Dev: Reads `GITHUB_TOKEN` or `GH_TOKEN` from `.env`
   - Production: Uses bundled `update-config.json` (created by CI)

4. **Windows installer**: Uses WiX (not Squirrel) for better icon support and single update mechanism

## Documentation

- **[.context/STARTER_GUIDE.md](.context/STARTER_GUIDE.md)** - Comprehensive guide with examples
- **[.context/PROJECT_BRIEF.md](.context/PROJECT_BRIEF.md)** - Project specification template
- **[.context/UI_UX_SPEC.md](.context/UI_UX_SPEC.md)** - Design specification template
- **[.context/IMPLEMENTATION_PLAN.md](.context/IMPLEMENTATION_PLAN.md)** - Development roadmap template
