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
- npm

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run start
\`\`\`

### Build

\`\`\`bash
npm run package
\`\`\`

### Create Distributable

\`\`\`bash
npm run make
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
