# Releasing

This app uses [**Conventional Commits**](https://www.conventionalcommits.org/) and [**release-it**](https://github.com/release-it/release-it) (with the `@release-it/conventional-changelog` plugin) to bump the version, regenerate `CHANGELOG.md`, and tag the release locally. Pushing the resulting `v*.*.*` tag triggers a GitHub Actions workflow that builds platform installers with **electron-builder** and publishes them to a GitHub Release.

The whole app — `package.json`, the changelog, the git tag, the installers — shares **one version**. Every release bumps them together.

## Branch model

One long-lived branch:

| Branch | Purpose                                                                       |
| :----- | :---------------------------------------------------------------------------- |
| `main` | Integration + release branch. All work lands here via PRs; releases cut here. |

Feature work happens on short-lived branches that PR into `main`. `release-it` refuses to run from any other branch — see `.release-it.json` (`requireBranch: "main"`).

```
main ──●──●──●──●──●──●──●──●──●──●──
                 ↑       ↑        ↑
             v0.4.3   v0.4.4   v0.4.5     (release commits + tags live on main)
```

## Workflow

### 1. Create a branch

```bash
git checkout main
git pull
git checkout -b feat/my-change
```

Branch prefixes (match the Conventional Commit types):

| Prefix      | Purpose                               |
| :---------- | :------------------------------------ |
| `feat/`     | New feature                           |
| `fix/`      | Bug fix                               |
| `perf/`     | Performance work                      |
| `refactor/` | Restructuring without behavior change |
| `docs/`     | Documentation only                    |
| `test/`     | Test-only changes                     |
| `chore/`    | Dependencies, config, cleanup         |

### 2. Make your changes — commit with conventional messages

Commit messages on feature branches should follow Conventional Commits, because **they feed the changelog** when release-it runs.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples (see `CHANGELOG.md` for real ones from this repo):

```
feat: silent updates and workflow improvements
fix: init script should modify release workflow for unused platforms
fix: workflow errors
chore(deps-dev): bump the development-dependencies group
```

The `conventionalcommits` preset is configured in `.release-it.json` with these section mappings:

| Type                                   | Shows under    | In changelog?           |
| :------------------------------------- | :------------- | :---------------------- |
| `feat`                                 | Features       | yes                     |
| `fix`                                  | Bug Fixes      | yes                     |
| `perf`                                 | Performance    | yes                     |
| `refactor`                             | Refactoring    | yes                     |
| `docs`                                 | Documentation  | yes                     |
| `chore`                                | —              | hidden                  |
| `style`                                | —              | hidden                  |
| `test`                                 | —              | hidden                  |
| `!` suffix / `BREAKING CHANGE:` footer | major bump     | highlighted             |

### 3. Open a PR into `main`

```bash
git push -u origin feat/my-change
# Open PR → main on GitHub
```

Prefer **squash merge** with a conventional-commit title, or **rebase merge** to keep commits as authored. Avoid merge commits — they muddy the history that `conventional-changelog` reads when generating release notes.

### 4. Cut a release

Releases are driven **locally** from a clean `main` checkout:

```bash
git checkout main
git pull

# Pick one:
pnpm run release          # interactive — release-it prompts for the bump
pnpm run release:patch    # 0.4.5 → 0.4.6
pnpm run release:minor    # 0.4.5 → 0.5.0
pnpm run release:major    # 0.4.5 → 1.0.0
```

Each of these runs `dotenv -- release-it …`, which loads `.env` so that `GITHUB_TOKEN` / `GH_TOKEN` is available.

What release-it does, in order (see `.release-it.json`):

1. **`before:init` hooks** — runs `pnpm run lint` and `pnpm exec tsc --noEmit`. Fails the release if either does.
2. Determines the next version (from the CLI flag, or interactively).
3. Bumps `version` in `package.json`.
4. **`after:bump` hook** — runs `pnpm install --lockfile-only` (refreshes the lockfile's version reference) and `pnpm run format` (keeps the bumped files Prettier-clean).
5. Regenerates `CHANGELOG.md` via `@release-it/conventional-changelog` from commits since the last tag.
6. Commits with message `chore(release): v${version}`.
7. Tags `v${version}` with annotation `Release v${version}`.
8. Pushes the commit and the tag to `origin/main`.

`release-it` is configured with:

- `github.release: false` — it does **not** create the GitHub Release itself. The tag push is what kicks off the CI workflow, and that workflow creates the release.
- `npm.publish: false` — this is a private app; nothing goes to npm.
- `git.requireBranch: "main"` / `requireCleanWorkingDir: true` / `requireUpstream: true` — release-it will refuse to run unless you're on `main`, clean, and tracking a remote.

### 5. CI builds and publishes

`.github/workflows/release.yaml` is triggered by the tag push (`on: push: tags: ['v*.*.*']`) and has two jobs:

**`build`** (matrix: `windows-latest`, `macos-latest`, `ubuntu-latest`):

1. Checks out the tag, installs Node 22 + pnpm 10, installs deps with `--frozen-lockfile`.
2. Copies `.env.example` → `.env` (electron-builder requires the file to exist during the build).
3. Writes `update-config.json` containing `{"token":"${{ secrets.GH_RELEASE_TOKEN }}"}`. This file is bundled into the app by electron-builder (`extraResources` in `electron-builder.yml`) so the **installed** app can authenticate against the private repo's release assets at update-check time.
4. Runs `pnpm run make`, which does `electron-vite build && electron-builder build`. Per `electron-builder.yml`, this produces:
   - Windows: `Electron-Starter-<version>-Windows-Setup.exe` (NSIS, x64)
   - macOS: `Electron-Starter-<version>-macOS-x64.zip` + `…-arm64.zip`
   - Linux: `Electron-Starter-<version>-Linux-<arch>.deb` + `.rpm`
5. Uploads the platform's `out/**/*` as a workflow artifact.

**`release`** (Linux, needs all three `build` matrix legs to succeed):

6. Downloads all three artifact sets.
7. Strips `*.blockmap` files and dot-separated duplicate installer names.
8. Builds the release-notes body from `git log <prev-tag>..HEAD` (the PR/commit titles are the notes).
9. Copies the final installers + `latest*.yml` updater manifests into `release-files/`.
10. Creates the GitHub Release via `softprops/action-gh-release@v2`, uploading everything in `release-files/`. Tags with a `-` suffix (e.g. `v0.5.0-rc.1`) are automatically marked prerelease.

After a handful of releases, `main`'s history looks like a normal development log interleaved with `chore(release): v0.X.Y` commits — each of which has a matching `v0.X.Y` tag.

## Commands (local)

```bash
# Full interactive release (recommended)
pnpm run release

# Non-interactive bumps
pnpm run release:patch
pnpm run release:minor
pnpm run release:major

# Dry-run (no commits, no pushes, no CI) — useful for sanity checks
pnpm exec release-it --dry-run
```

You should never need to hand-edit `CHANGELOG.md` or the `version` field in `package.json` — if you find yourself tempted, the release-it config is wrong and we should fix it rather than work around it.

## Configuration

- **release-it + changelog** — `.release-it.json` (root).
- **electron-builder (installers, ASAR, Fuses, publish target)** — `electron-builder.yml`.
- **CI workflow** — `.github/workflows/release.yaml`.
- **Env var template** — `.env.example`.

## Setup requirements

The release pipeline needs GitHub tokens in two places:

| Where                       | Name (either works)             | Purpose                                                                                                                                                                                  |
| :-------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local `.env` (gitignored)   | `GITHUB_TOKEN` or `GH_TOKEN`    | Consumed by `release-it` via `dotenv-cli`. Needs `Contents: Read/Write` (so it can push commits + tags to `main`). Also consumed by `electron-updater` when you test updates in dev.     |
| Repo secret (GitHub → Settings → Secrets → Actions) | `GH_RELEASE_TOKEN` | Fine-grained PAT with `Contents: Read`, `Metadata: Read` on this repo. Written into `update-config.json` during CI and **bundled into each installer** so the installed app can authenticate to fetch private release assets. |

`secrets.GITHUB_TOKEN` (the automatic workflow token) is used by the workflow for publishing the Release itself — no setup needed.

### Why a separate `GH_RELEASE_TOKEN`?

`GITHUB_TOKEN` in Actions is short-lived and scoped to the running job; it cannot be embedded in a shipped installer. For private-repo auto-updates we need a long-lived PAT the **end user's installed app** can present when it asks GitHub for `latest.yml` and the installer blob. That's `GH_RELEASE_TOKEN`. Rotating it means cutting a new release so the fresh token ships in the next installer.

### Local dev (optional)

Auto-update checking runs in production builds. To exercise the flow against `pnpm dev`, put a GitHub PAT in `.env` as `GITHUB_TOKEN` or `GH_TOKEN` — `electron-updater` will pick it up. Without a token, update checks cleanly fail with a "not configured" error. See `.env.example`.

## Example: full cycle

```bash
# Start work
git checkout main && git pull
git checkout -b feat/cool-thing

# ... make changes ...
git add -A
git commit -m "feat: add cool thing"

# Push and open PR → main
git push -u origin feat/cool-thing

# CI runs (type-check, lint via release-it's preflight).
# Review, merge to main via squash/rebase. Repeat for more PRs.

# Ready to release?
git checkout main && git pull
pnpm run release          # or :patch / :minor / :major

# release-it lints, type-checks, bumps, regenerates the changelog,
# commits, tags, pushes. Tag push triggers .github/workflows/release.yaml.
# A few minutes later a GitHub Release appears with Win/mac/Linux installers
# and the electron-updater latest*.yml manifests.
```

## Why this model

- **Single version** — the app ships as one product; `package.json` is the source of truth, and the tag on `main` matches it.
- **Local release, CI build** — release-it keeps version/tag/changelog consistent on a developer machine (with the safety rails of `requireBranch`/`requireCleanWorkingDir`). Building and publishing across three OSes belongs in CI where the right signing and OS tooling lives.
- **Tag-triggered workflow** — no manual "Run workflow" step; the act of pushing `v0.X.Y` is the signal. If release-it succeeded locally, the artifacts will appear on GitHub without further input.
- **PR titles feed the changelog** — the commit message _is_ the release note. If a PR title doesn't describe a user-visible change well, the PR probably isn't ready.
- **Private-repo auto-update baked in** — `GH_RELEASE_TOKEN` → `update-config.json` → `extraResources` means the shipped app can authenticate against private release assets without any user configuration.
