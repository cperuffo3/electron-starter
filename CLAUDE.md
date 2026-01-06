# CLAUDE.md

This file provides quick guidance to Claude Code when working with this repository.

> **For comprehensive documentation**, see [.context/STARTER_GUIDE.md](.context/STARTER_GUIDE.md) which covers architecture, patterns, and step-by-step instructions for all common tasks.

## Quick Reference

### Commands

```bash
# Development
pnpm run start              # Run app in dev mode (hot reload)

# Code Quality
pnpm run lint               # ESLint check and fix
pnpm run format             # Prettier format

# Build & Package
pnpm run package            # Package for current platform
pnpm run make               # Create distributable installers

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
| Framework | Electron 39 + Electron Forge          |
| Build     | Vite 7                                |
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

## Documentation

- **[.context/STARTER_GUIDE.md](.context/STARTER_GUIDE.md)** - Comprehensive guide with examples
- **[.context/PROJECT_BRIEF.md](.context/PROJECT_BRIEF.md)** - Project specification template
- **[.context/UI_UX_SPEC.md](.context/UI_UX_SPEC.md)** - Design specification template
- **[.context/IMPLEMENTATION_PLAN.md](.context/IMPLEMENTATION_PLAN.md)** - Development roadmap template
