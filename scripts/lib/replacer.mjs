import fs from "fs/promises";
import path from "path";

/**
 * Files that need to be updated during initialization
 */
export const FILES_TO_UPDATE = {
  packageJson: ["package.json"],
  forgeConfig: ["forge.config.ts"],
  indexHtml: ["index.html"],
  updateNotification: ["src/components/update-notification.tsx"],
  docs: ["README.md", "CLAUDE.md"],
};

/**
 * Replace content in a file
 * @param {string} filePath - Absolute path to the file
 * @param {Array<{from: string|RegExp, to: string}>} replacements - Replacements to make
 * @returns {Promise<boolean>} - True if file was updated, false if not found
 */
async function replaceInFile(filePath, replacements) {
  try {
    let content = await fs.readFile(filePath, "utf-8");
    for (const { from, to } of replacements) {
      if (typeof from === "string") {
        content = content.split(from).join(to);
      } else {
        content = content.replace(from, to);
      }
    }
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, skip silently
      return false;
    }
    throw error;
  }
}

/**
 * Update package.json with new project information
 * @param {string} rootDir - Root directory of the project
 * @param {object} config - Configuration object
 * @param {string} config.projectName - Project name (kebab-case)
 * @param {string} config.productName - Product name (display name)
 * @param {string} config.description - Project description
 * @param {string} config.version - Initial version
 * @param {string} config.githubOwner - GitHub owner
 * @param {string} config.authorName - Author name
 * @param {string} config.authorEmail - Author email
 * @param {string} config.appId - App ID (reverse domain notation)
 */
export async function updatePackageJson(rootDir, config) {
  const pkgPath = path.join(rootDir, "package.json");

  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

    // Update basic fields
    pkg.name = config.projectName;
    pkg.productName = config.productName;
    pkg.description = config.description;
    pkg.version = config.version;
    pkg.author = `${config.authorName} <${config.authorEmail}>`;

    // Update build config
    if (pkg.build) {
      pkg.build.appId = config.appId;
      pkg.build.productName = config.productName;
      if (pkg.build.publish) {
        pkg.build.publish.owner = config.githubOwner;
        pkg.build.publish.repo = config.projectName;
      }
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Update forge.config.ts with new GitHub publish settings
 * @param {string} rootDir - Root directory of the project
 * @param {string} githubOwner - GitHub owner
 * @param {string} projectName - Project name
 */
export async function updateForgeConfig(rootDir, githubOwner, projectName) {
  await replaceInFile(path.join(rootDir, "forge.config.ts"), [
    { from: 'owner: "cperuffo3"', to: `owner: "${githubOwner}"` },
    { from: 'name: "electron-starter"', to: `name: "${projectName}"` },
  ]);
}

/**
 * Update index.html with new title
 * @param {string} rootDir - Root directory of the project
 * @param {string} productName - Product name (display name)
 */
export async function updateIndexHtml(rootDir, productName) {
  await replaceInFile(path.join(rootDir, "index.html"), [
    {
      from: "<title>Electron Starter</title>",
      to: `<title>${productName}</title>`,
    },
  ]);
}

/**
 * Update update-notification.tsx with new GitHub release URL
 * @param {string} rootDir - Root directory of the project
 * @param {string} githubOwner - GitHub owner
 * @param {string} projectName - Project name
 */
export async function updateNotificationComponent(
  rootDir,
  githubOwner,
  projectName,
) {
  await replaceInFile(
    path.join(rootDir, "src/components/update-notification.tsx"),
    [
      {
        from: "https://github.com/cperuffo3/electron-starter/releases/latest",
        to: `https://github.com/${githubOwner}/${projectName}/releases/latest`,
      },
    ],
  );
}

/**
 * Update README.md with new project information
 * @param {string} rootDir - Root directory of the project
 * @param {string} productName - Product name (display name)
 * @param {string} description - Project description
 */
export async function updateReadme(rootDir, productName, description) {
  const readmePath = path.join(rootDir, "README.md");

  const newReadme = `# ${productName}

${description}

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Development

\`\`\`bash
pnpm run start
\`\`\`

### Build

\`\`\`bash
pnpm run package
\`\`\`

### Create Distributable

\`\`\`bash
pnpm run make
\`\`\`

## Tech Stack

- [Electron](https://www.electronjs.org) - Desktop app framework
- [React](https://reactjs.org) - UI library
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [TanStack Router](https://tanstack.com/router) - Routing
- [oRPC](https://orpc.unnoq.com) - IPC communication

## License

MIT
`;

  await fs.writeFile(readmePath, newReadme, "utf-8");
}

/**
 * Update CLAUDE.md with new project name
 * @param {string} rootDir - Root directory of the project
 * @param {string} productName - Product name
 */
export async function updateClaudeMd(rootDir, productName) {
  await replaceInFile(path.join(rootDir, "CLAUDE.md"), [
    { from: "Electron Starter", to: productName },
    {
      from: "electron-starter",
      to: productName.toLowerCase().replace(/\s+/g, "-"),
    },
  ]);
}

/**
 * Update hero-section.tsx with new product name
 * @param {string} rootDir - Root directory of the project
 * @param {string} productName - Product name (display name)
 */
export async function updateHeroSection(rootDir, productName) {
  await replaceInFile(
    path.join(rootDir, "src/components/home/hero-section.tsx"),
    [
      {
        from: ">Electron Starter</h1>",
        to: `>${productName}</h1>`,
      },
    ],
  );
}

/**
 * Update base-layout.tsx with new product name in title bar
 * @param {string} rootDir - Root directory of the project
 * @param {string} productName - Product name (display name)
 */
export async function updateBaseLayout(rootDir, productName) {
  await replaceInFile(path.join(rootDir, "src/layouts/base-layout.tsx"), [
    {
      from: '<DragWindowRegion title="Electron Starter"',
      to: `<DragWindowRegion title="${productName}"`,
    },
  ]);
}

/**
 * Reset CHANGELOG.md with the initial version
 * @param {string} rootDir - Root directory of the project
 * @param {string} version - Initial version
 * @param {string} productName - Product name (display name)
 */
export async function resetChangelog(rootDir, version, productName) {
  const changelogPath = path.join(rootDir, "CHANGELOG.md");
  const today = new Date().toISOString().split("T")[0];

  const newChangelog = `# Changelog

## ${version} (${today})

### Initial Release

- Initial release of ${productName}
`;

  await fs.writeFile(changelogPath, newChangelog, "utf-8");
}

/**
 * Update main.ts with new GitHub owner and repo for autoUpdater
 * @param {string} rootDir - Root directory of the project
 * @param {string} githubOwner - GitHub owner
 * @param {string} projectName - Project name (repo name)
 */
export async function updateMainTs(rootDir, githubOwner, projectName) {
  await replaceInFile(path.join(rootDir, "src/main.ts"), [
    {
      from: 'owner: "cperuffo3"',
      to: `owner: "${githubOwner}"`,
    },
    {
      from: 'repo: "electron-starter"',
      to: `repo: "${projectName}"`,
    },
  ]);
}

/**
 * Remove the init-project script entry from package.json
 * This prevents the script from being run again after initialization
 * @param {string} rootDir - Root directory of the project
 */
export async function removeInitScript(rootDir) {
  const pkgPath = path.join(rootDir, "package.json");

  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    delete pkg.scripts["init-project"];
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    return true;
  } catch (error) {
    console.error(
      "Warning: Could not remove init-project script:",
      error.message,
    );
    return false;
  }
}

/**
 * Update electron-builder.yml with repository visibility and platform configuration
 * @param {string} rootDir - Root directory of the project
 * @param {object} config - Configuration object
 * @param {string} config.githubOwner - GitHub owner
 * @param {string} config.projectName - Project name
 * @param {string} config.productName - Product name (display name)
 * @param {boolean} config.isPrivate - Whether the repository is private
 * @param {string[]} config.platforms - Target platforms (windows, macos, linux)
 */
export async function updateElectronBuilderConfig(rootDir, config) {
  const configPath = path.join(rootDir, "electron-builder.yml");

  try {
    let content = await fs.readFile(configPath, "utf-8");

    // Update productName
    content = content.replace(
      /productName: .+/,
      `productName: ${config.productName}`,
    );

    // Update owner and repo
    content = content.replace(/owner: .+/, `owner: ${config.githubOwner}`);
    content = content.replace(/repo: .+/, `repo: ${config.projectName}`);

    // Update private flag
    content = content.replace(
      /private: (true|false)/,
      `private: ${config.isPrivate}`,
    );

    // Configure platform targets based on selected platforms
    if (!config.platforms.includes("windows")) {
      // Comment out Windows configuration
      content = content.replace(
        /(# Windows configuration\nwin:[\s\S]*?artifactName:[^\n]+)/,
        (match) =>
          match
            .split("\n")
            .map((line) => `# ${line}`)
            .join("\n"),
      );
    }

    if (!config.platforms.includes("macos")) {
      // Comment out macOS configuration
      content = content.replace(
        /(# macOS configuration\nmac:[\s\S]*?artifactName:[^\n]+)/,
        (match) =>
          match
            .split("\n")
            .map((line) => `# ${line}`)
            .join("\n"),
      );
    }

    if (!config.platforms.includes("linux")) {
      // Comment out Linux configuration
      content = content.replace(
        /(# Linux configuration\nlinux:[\s\S]*?# RPM-specific options[\s\S]*?- libXScrnSaver)/,
        (match) =>
          match
            .split("\n")
            .map((line) => `# ${line}`)
            .join("\n"),
      );
    }

    await fs.writeFile(configPath, content, "utf-8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Update release.yaml workflow with repository visibility and platform configuration
 * @param {string} rootDir - Root directory of the project
 * @param {object} config - Configuration object
 * @param {boolean} config.isPrivate - Whether the repository is private
 * @param {string[]} config.platforms - Target platforms (windows, macos, linux)
 */
export async function updateReleaseWorkflow(rootDir, config) {
  const workflowPath = path.join(rootDir, ".github/workflows/release.yaml");

  try {
    let content = await fs.readFile(workflowPath, "utf-8");

    // Update update-config.json creation based on repo visibility
    if (!config.isPrivate) {
      // For public repos, use GITHUB_TOKEN instead of GH_RELEASE_TOKEN
      content = content.replace(
        /echo '\{"token":"\$\{\{ secrets\.GH_RELEASE_TOKEN \}\}"\}' > update-config\.json/,
        'echo \'{"token":"${{ secrets.GITHUB_TOKEN }}"}\'  > update-config.json',
      );

      // Update the comment to reflect public repo usage
      content = content.replace(
        /# IMPORTANT: For private repos, electron-updater needs a long-lived PAT, not GITHUB_TOKEN\n {6}# Create a GitHub PAT with: Contents \(Read\), Metadata \(Read\)\n {6}# Add it as a repository secret named GH_RELEASE_TOKEN/,
        "# For public repos: Use GITHUB_TOKEN (workflow token)\n      # For private repos: Use GH_RELEASE_TOKEN (long-lived PAT)\n      # Create a GitHub PAT with: Contents (Read), Metadata (Read)",
      );
    }

    // Comment out matrix entries for non-selected platforms
    if (!config.platforms.includes("windows")) {
      content = content.replace(
        /( +)- os: windows-latest\n( +)platform: win\n/,
        "$1# - os: windows-latest\n$2#   platform: win\n",
      );
    }
    if (!config.platforms.includes("macos")) {
      content = content.replace(
        /( +)- os: macos-latest\n( +)platform: mac\n/,
        "$1# - os: macos-latest\n$2#   platform: mac\n",
      );
    }
    if (!config.platforms.includes("linux")) {
      content = content.replace(
        /( +)- os: ubuntu-latest\n( +)platform: linux\n/,
        "$1# - os: ubuntu-latest\n$2#   platform: linux\n",
      );
    }

    // Comment out artifact download steps for non-selected platforms
    if (!config.platforms.includes("windows")) {
      content = content.replace(
        /( +)- name: Download Windows artifacts\n( +)uses: actions\/download-artifact@v4\n( +)with:\n( +)name: release-win\n( +)path: artifacts\/win\n/,
        "$1# - name: Download Windows artifacts\n$2#   uses: actions/download-artifact@v4\n$3#   with:\n$4#     name: release-win\n$5#     path: artifacts/win\n",
      );
    }
    if (!config.platforms.includes("macos")) {
      content = content.replace(
        /( +)- name: Download macOS artifacts\n( +)uses: actions\/download-artifact@v4\n( +)with:\n( +)name: release-mac\n( +)path: artifacts\/mac\n/,
        "$1# - name: Download macOS artifacts\n$2#   uses: actions/download-artifact@v4\n$3#   with:\n$4#     name: release-mac\n$5#     path: artifacts/mac\n",
      );
    }
    if (!config.platforms.includes("linux")) {
      content = content.replace(
        /( +)- name: Download Linux artifacts\n( +)uses: actions\/download-artifact@v4\n( +)with:\n( +)name: release-linux\n( +)path: artifacts\/linux\n/,
        "$1# - name: Download Linux artifacts\n$2#   uses: actions/download-artifact@v4\n$3#   with:\n$4#     name: release-linux\n$5#     path: artifacts/linux\n",
      );
    }

    // Comment out download instructions in release body for non-selected platforms
    if (!config.platforms.includes("windows")) {
      content = content.replace(
        /( +)\*\*Windows:\*\* Download `Electron-Starter-\*-Windows-Setup\.exe`\n/,
        "$1# **Windows:** Download `Electron-Starter-*-Windows-Setup.exe`\n",
      );
    }
    if (!config.platforms.includes("macos")) {
      content = content.replace(
        /( +)\*\*macOS \(Intel\):\*\* Download `Electron-Starter-\*-macOS-x64\.zip`\n/,
        "$1# **macOS (Intel):** Download `Electron-Starter-*-macOS-x64.zip`\n",
      );
      content = content.replace(
        /( +)\*\*macOS \(Apple Silicon\):\*\* Download `Electron-Starter-\*-macOS-arm64\.zip`\n/,
        "$1# **macOS (Apple Silicon):** Download `Electron-Starter-*-macOS-arm64.zip`\n",
      );
    }
    if (!config.platforms.includes("linux")) {
      content = content.replace(
        /( +)\*\*Linux \(Debian\/Ubuntu\):\*\* Download `Electron-Starter-\*-Linux-\*\.deb`\n/,
        "$1# **Linux (Debian/Ubuntu):** Download `Electron-Starter-*-Linux-*.deb`\n",
      );
      content = content.replace(
        /( +)\*\*Linux \(Fedora\/RHEL\):\*\* Download `Electron-Starter-\*-Linux-\*\.rpm`\n/,
        "$1# **Linux (Fedora/RHEL):** Download `Electron-Starter-*-Linux-*.rpm`\n",
      );
    }

    await fs.writeFile(workflowPath, content, "utf-8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
