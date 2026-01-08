# Migration Summary: Electron Forge → electron-vite + electron-builder

This document summarizes all changes made to migrate the Electron application from **Electron Forge** to **electron-vite + electron-builder** for building and packaging.

---

## 1. Build System Migration

### Removed (Electron Forge)

- Deleted `forge.config.ts` (87 lines) - Forge configuration
- Deleted `forge.env.d.ts` - Forge type declarations
- Deleted `vite.main.config.mts` - Separate main process config
- Deleted `vite.preload.config.mts` - Separate preload config
- Deleted `vite.renderer.config.mts` - Separate renderer config

### Added (electron-vite + electron-builder)

- Created `electron-builder.yml` - Platform-specific packaging config
- Created `electron.vite.config.ts` - Unified build configuration

---

## 2. Package Dependencies

### package.json Changes

**Changed `main` field:**

```json
// OLD
"main": ".vite/build/main.js"

// NEW
"main": "dist/main/index.js"
```

**Removed packages:**

- All `@electron-forge/*` packages:
  - `@electron-forge/cli`
  - `@electron-forge/maker-deb`
  - `@electron-forge/maker-rpm`
  - `@electron-forge/maker-wix`
  - `@electron-forge/maker-zip`
  - `@electron-forge/plugin-auto-unpack-natives`
  - `@electron-forge/plugin-fuses`
  - `@electron-forge/plugin-vite`
  - `@electron-forge/publisher-github`
  - `@electron-forge/shared-types`

**Added packages:**

- `electron-builder` v26.4.0
- `electron-vite` v5.0.0
- `vite-plugin-static-copy` v3.1.4

**Script changes:**

```json
{
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "preview": "electron-vite preview",
  "start": "electron-vite dev",
  "package": "electron-vite build && electron-builder build --dir",
  "make": "electron-vite build && electron-builder build",
  "make:win": "electron-vite build && electron-builder build --win",
  "make:mac": "electron-vite build && electron-builder build --mac",
  "make:linux": "electron-vite build && electron-builder build --linux"
}
```

**Removed from package.json:**

- `build` field configuration (moved to `electron-builder.yml`)

---

## 3. Main Process Changes (src/main.ts)

### Environment Loading

**Changed from:**

```typescript
import "dotenv/config";
```

**To:**

```typescript
import { config } from "dotenv";
import { existsSync } from "fs";

// Load .env file - try multiple possible locations
const possibleEnvPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, "../../.env"), // From dist/main back to project root
  path.join(app.getAppPath(), ".env"),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    const result = config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded && !app.isPackaged) {
  console.warn("[Dotenv] No .env file found in development");
}
```

### Update Token Handling

**Changed from:**

```typescript
if (process.env.GH_TOKEN) {
  return process.env.GH_TOKEN;
}
```

**To:**

```typescript
// Check both GH_TOKEN and GITHUB_TOKEN for flexibility
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (token) {
  return token;
}
```

### Path Changes for electron-vite

**Preload script path:**

```typescript
// OLD
const preload = path.join(__dirname, "preload.js");

// NEW
const preload = path.join(__dirname, "../preload/index.js");
```

**Window loading:**

```typescript
// OLD
if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
} else {
  mainWindow.loadFile(
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
  );
}

// NEW
const isDev = !app.isPackaged;

if (isDev) {
  mainWindow.loadURL("http://localhost:5173"); // electron-vite default port
} else {
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}
```

---

## 4. Type Declarations (src/types.d.ts)

**Replaced Forge-specific globals:**

```typescript
// OLD (Forge):
declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  const MAIN_WINDOW_VITE_NAME: string;
}

// NEW (electron-vite):
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ELECTRON_RENDERER_URL?: string;
      NODE_ENV: "development" | "production";
    }
  }
}
```

---

## 5. TypeScript Configuration (tsconfig.json)

**Changed includes:**

```json
// OLD
"include": [
  "src/**/*",
  "./package.json",
  "./forge.config.ts",
  "*.mts",
  "vite.renderer.config.mts"
]

// NEW
"include": [
  "src/**/*",
  "./package.json",
  "./electron.vite.config.ts",
  "*.mts"
]
```

---

## 6. Git Configuration (.gitignore)

**Updated comments:**

```diff
-# Vite
+# Vite & electron-vite
 .vite/
 dist/

-# Electron-Forge
+# Electron Builder
 out/
```

---

## 7. Documentation Updates

### Files Updated

- `CLAUDE.md`
- `README.md`
- `.context/STARTER_GUIDE.md`

### Changes Made

**1. Tech stack tables:**

```markdown
| Layer     | Technology                  |
| --------- | --------------------------- |
| Framework | Electron 39 + electron-vite |
| Build     | Vite 7 (via electron-vite)  |
| Packaging | electron-builder            |
```

**2. Commands section:**

```bash
# Development
pnpm run dev                # Run app in dev mode (hot reload)
pnpm run start              # Alias for dev

# Build
pnpm run build              # Build for production

# Package & Distribute
pnpm run package            # Package without creating installer
pnpm run make               # Create distributable installers
pnpm run make:win           # Windows only (WiX MSI)
pnpm run make:mac           # macOS only (ZIP)
pnpm run make:linux         # Linux only (DEB, RPM)
```

**3. Build configuration section (NEW):**

```markdown
### Build Configuration

The project uses **electron-vite** for building with a unified `electron.vite.config.ts` configuration that handles:

- Main process bundling
- Preload script bundling
- Renderer process bundling (React, TanStack Router, Tailwind)

Packaging is handled by **electron-builder** with configuration in `package.json` and `electron-builder.yml`:

- ASAR packaging with integrity validation
- Electron Fuses for security hardening
- Platform-specific targets: WiX (Windows), ZIP (macOS), DEB/RPM (Linux)
- Private GitHub repository auto-updates
```

**4. Auto-updates section:**

```markdown
- Dev: Reads `GITHUB_TOKEN` or `GH_TOKEN` from `.env`
- Production: Uses bundled `update-config.json` (created by CI)
```

**5. File structure updates:**

- Changed output paths from `.vite/build/` to `dist/main/`, `dist/preload/`, `dist/renderer/`

---

## 8. CI/CD Changes (.github/workflows/release.yaml)

**Added Linux build matrix:**

```yaml
matrix:
  include:
    - os: windows-latest
      platform: win
    - os: macos-latest
      platform: mac
    - os: ubuntu-latest
      platform: linux
```

**Updated artifact paths:**

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: release-${{ matrix.platform }}
    path: |
      out/make/**/*
      out/*.exe
      out/*.zip
      out/*.dmg
      out/*.deb
      out/*.rpm
    retention-days: 1
```

**Added Linux artifact download:**

```yaml
- name: Download Linux artifacts
  uses: actions/download-artifact@v4
  with:
    name: release-linux
    path: artifacts/linux
```

**Updated release asset patterns:**

```yaml
files: |
  artifacts/**/*.exe
  artifacts/**/*.zip
  artifacts/**/*.dmg
  artifacts/**/*.deb
  artifacts/**/*.rpm
  artifacts/**/*.AppImage
  artifacts/**/*.yml
  artifacts/**/*.blockmap
```

---

## 9. Environment Variable Documentation (.env.example)

**Added note:**

```bash
# You can use either GITHUB_TOKEN or GH_TOKEN (both are supported)
# GITHUB_TOKEN=your-github-personal-access-token
# GH_TOKEN=your-github-personal-access-token
```

---

## 10. Claude Settings (.claude/settings.local.json)

**Added to allowed commands:**

```json
"allow": [
  "Bash(npx:*)",
  "Bash(7z l:*)"
]
```

---

## Key Migration Points

### 1. Build Output Structure

```
OLD (Forge):
.vite/build/main.js
.vite/build/preload.js
.vite/build/renderer/

NEW (electron-vite):
dist/main/index.js
dist/preload/index.js
dist/renderer/index.html
```

### 2. Configuration Consolidation

- **Before:** 3 separate Vite configs + `forge.config.ts` (4 files)
- **After:** Single `electron.vite.config.ts` + `electron-builder.yml` (2 files)

### 3. Dev Server Port

- **Before:** Dynamic port via `MAIN_WINDOW_VITE_DEV_SERVER_URL`
- **After:** Fixed `localhost:5173` (electron-vite default)

### 4. Token Flexibility

- Now supports both `GH_TOKEN` and `GITHUB_TOKEN` environment variables
- Added fallback logic for multiple `.env` file locations

### 5. Multi-Platform Support

- Explicit Windows (WiX MSI), macOS (ZIP), and Linux (DEB/RPM) targets
- Platform-specific make commands: `make:win`, `make:mac`, `make:linux`

### 6. Package Output

```
out/make/
├── wix/x64/*.msi          (Windows)
├── zip/darwin/x64/*.zip   (macOS)
├── deb/x64/*.deb          (Linux)
└── rpm/x64/*.rpm          (Linux)
```

---

## Benefits of This Migration

1. **Unified Configuration:** Single `electron.vite.config.ts` instead of multiple config files
2. **Better Performance:** electron-vite optimized specifically for Electron
3. **Simpler Setup:** Fewer dependencies and configuration files
4. **More Flexible:** electron-builder provides more packaging options
5. **Better Documentation:** electron-vite has clearer documentation for Electron-specific use cases
6. **Token Flexibility:** Support for both `GH_TOKEN` and `GITHUB_TOKEN` environment variables
7. **Production-Ready:** ASAR integrity validation and Electron Fuses for security
