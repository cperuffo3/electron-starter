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
 * @param {boolean} config.isPrivate - Whether the repository is private
 * @param {string[]} config.platforms - Target platforms (windows, macos, linux)
 */
export async function updateElectronBuilderConfig(rootDir, config) {
  const configPath = path.join(rootDir, "electron-builder.yml");

  try {
    let content = await fs.readFile(configPath, "utf-8");

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
    if (config.isPrivate) {
      // Comment out public repo step, uncomment private repo step
      content = content.replace(
        /( {6}# For public repos.*\n {6}- name: Create update-config\.json\n {8}run: \|\n {10}echo '\{"token":"\$\{\{ secrets\.GITHUB_TOKEN \}\}"\}' > update-config\.json\n {8}shell: bash\n)/,
        (match) =>
          match
            .split("\n")
            .map((line) => `# ${line}`)
            .join("\n") + "\n",
      );
      content = content.replace(
        /( {6}# For private repos:.*\n(?:.*\n)*? {6}# - name: Create update-config\.json \(Private Repo\)\n {6}# {3}run: \|\n {6}# {5}echo '\{"token":"\$\{\{ secrets\.GH_RELEASE_TOKEN \}\}"\}' > update-config\.json\n {6}# {3}shell: bash\n)/,
        (match) =>
          match
            .split("\n")
            .map((line) => line.replace(/^( {6})# /, "$1"))
            .join("\n"),
      );
    }

    // Filter build matrix to only include selected platforms
    const platformMap = {
      windows: { os: "windows-latest", platform: "win" },
      macos: { os: "macos-latest", platform: "mac" },
      linux: { os: "ubuntu-latest", platform: "linux" },
    };

    const matrixItems = config.platforms
      .map((p) => {
        const platform = platformMap[p];
        return `          - os: ${platform.os}\n            platform: ${platform.platform}`;
      })
      .join("\n");

    content = content.replace(
      /( {8}matrix:\n {10}include:\n)((?:.*\n)*?)( {0,8}\n {4}runs-on:)/,
      `$1${matrixItems}\n$3`,
    );

    // Update artifact download and release file upload sections
    const artifactDownloads = config.platforms
      .map((p) => {
        const platform = platformMap[p].platform;
        return `      - name: Download ${p === "macos" ? "macOS" : p.charAt(0).toUpperCase() + p.slice(1)} artifacts
        uses: actions/download-artifact@v4
        with:
          name: release-${platform}
          path: artifacts/${platform}`;
      })
      .join("\n\n");

    content = content.replace(
      /( {2}release:\n(?:.*\n)*? {6}- name: Download Windows artifacts\n(?:.*\n)*? {10}path: artifacts\/linux\n)/,
      (match) => {
        const beforeDownload = match.substring(
          0,
          match.indexOf("- name: Download Windows"),
        );
        return beforeDownload + artifactDownloads + "\n";
      },
    );

    // Update release files based on platforms
    const releaseFiles = [];
    if (config.platforms.includes("windows")) {
      releaseFiles.push("artifacts/win/**/*-Windows-Setup.exe");
    }
    if (config.platforms.includes("macos")) {
      releaseFiles.push(
        "artifacts/mac/**/*-macOS-x64.dmg",
        "artifacts/mac/**/*-macOS-arm64.dmg",
      );
    }
    if (config.platforms.includes("linux")) {
      releaseFiles.push(
        "artifacts/linux/**/*-Linux-amd64.deb",
        "artifacts/linux/**/*-Linux-x86_64.rpm",
      );
    }

    // Add latest.yml files
    config.platforms.forEach((p) => {
      const platform = platformMap[p].platform;
      const suffix =
        platform === "mac"
          ? "latest-mac.yml"
          : platform === "linux"
            ? "latest-linux.yml"
            : "latest.yml";
      releaseFiles.push(`artifacts/${platform}/**/${suffix}`);
    });

    const filesContent = releaseFiles.map((f) => `            ${f}`).join("\n");
    content = content.replace(
      /( {10}files: \|\n)((?:.*\n)*?)( {8}env:)/,
      `$1${filesContent}\n$3`,
    );

    // Update download instructions in release body
    const downloadInstructions = [];
    if (config.platforms.includes("windows")) {
      downloadInstructions.push(
        "**Windows:** Download `Electron-Starter-*-Windows-Setup.exe`",
      );
    }
    if (config.platforms.includes("macos")) {
      downloadInstructions.push(
        "**macOS (Intel):** Download `Electron-Starter-*-macOS-x64.zip`",
        "**macOS (Apple Silicon):** Download `Electron-Starter-*-macOS-arm64.zip`",
      );
    }
    if (config.platforms.includes("linux")) {
      downloadInstructions.push(
        "**Linux (Debian/Ubuntu):** Download `Electron-Starter-*-Linux-*.deb`",
        "**Linux (Fedora/RHEL):** Download `Electron-Starter-*-Linux-*.rpm`",
      );
    }

    const instructionsContent = downloadInstructions.join("\n            ");
    content = content.replace(
      /( {12}## Downloads\n\n)((?:.*\n)*?)( {12}\*Full changelog:)/,
      `$1            ${instructionsContent}\n\n$3`,
    );

    await fs.writeFile(workflowPath, content, "utf-8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
