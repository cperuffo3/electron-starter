// Lives in a .cjs file (not package.json) because conventional-changelog-writer v9
// renders partials as functions, and writerOpts.commitPartial below can't be JSON.
module.exports = {
  git: {
    commitMessage: "chore(release): v${version}",
    tagName: "v${version}",
    tagAnnotation: "Release v${version}",
    requireBranch: "main",
    requireCleanWorkingDir: true,
    requireUpstream: true,
  },
  github: {
    release: false,
    tokenRef: "GH_TOKEN",
  },
  npm: {
    publish: false,
  },
  hooks: {
    "before:init": ["pnpm run lint", "pnpm run type-check"],
    "after:bump": "pnpm install --lockfile-only && pnpm run format",
    // The infile is written after the format hook above; prettier here turns
    // the writer's hardcoded "*" bullets into "-" before the release commit.
    "before:git:release": "npx prettier --write CHANGELOG.md",
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: {
        name: "conventionalcommits",
        // conventionalcommits >=10 ignores the old `hidden: true` flag;
        // visibility and bump behavior are driven by `effect` instead.
        types: [
          { type: "feat", section: "Features", effect: "bump" },
          { type: "fix", section: "Bug Fixes", effect: "bump" },
          { type: "perf", section: "Performance", effect: "bump" },
          { type: "refactor", section: "Refactoring", effect: "bump" },
          { type: "docs", section: "Documentation", effect: "bump" },
          { type: "chore", effect: "hidden" },
          { type: "style", effect: "hidden" },
          { type: "test", effect: "hidden" },
        ],
      },
      infile: "CHANGELOG.md",
      writerOpts: {
        // Bare commit headers, no hash links, matching the existing style.
        commitPartial: (context, commit) => commit.header ?? "",
      },
    },
  },
};
