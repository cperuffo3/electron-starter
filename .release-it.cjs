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
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: {
        name: "conventionalcommits",
        types: [
          { type: "feat", section: "Features" },
          { type: "fix", section: "Bug Fixes" },
          { type: "perf", section: "Performance" },
          { type: "refactor", section: "Refactoring" },
          { type: "docs", section: "Documentation" },
          { type: "chore", hidden: true },
          { type: "style", hidden: true },
          { type: "test", hidden: true },
        ],
      },
      infile: "CHANGELOG.md",
      writerOpts: {
        // Bare commit headers, no hash links; prettier (after:bump) turns the
        // writer's "*" bullets into "-" to match the existing changelog style.
        commitPartial: (context, commit) => commit.header ?? "",
      },
    },
  },
};
