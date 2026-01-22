#!/usr/bin/env node

/**
 * Project Initialization Script
 *
 * This script helps users "claim" the electron boilerplate template for their own project.
 * It handles:
 * - Renaming the project and product name
 * - Updating author information
 * - Configuring GitHub publish settings
 * - Resetting version numbers
 * - Optionally resetting git history
 */

import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// These modules are dynamically imported after pnpm install
let prompts;
let replacer;
let utils;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/**
 * Check if the project has already been initialized
 * @returns {Promise<boolean>}
 */
async function isAlreadyInitialized() {
  try {
    const rootPkg = JSON.parse(
      await fs.readFile(path.join(ROOT, "package.json"), "utf-8"),
    );
    // If the name doesn't contain 'starter', it's been initialized
    return !rootPkg.name.includes("starter");
  } catch {
    return false;
  }
}

/**
 * Reset git history with a fresh initial commit
 * @param {string} projectName - The new project name
 */
async function resetGitHistory(projectName) {
  console.log("\nResetting git history...");

  try {
    // Remove .git directory
    await fs.rm(path.join(ROOT, ".git"), { recursive: true, force: true });

    // Initialize fresh repo
    execSync("git init", { cwd: ROOT, stdio: "pipe" });

    // Add all files
    execSync("git add -A", { cwd: ROOT, stdio: "pipe" });

    // Create initial commit
    const titleName = utils.toTitleCase(projectName);
    execSync(`git commit -m "Initial commit: ${titleName}"`, {
      cwd: ROOT,
      stdio: "pipe",
    });

    console.log("Git history reset with fresh initial commit.");
  } catch (error) {
    console.error("Warning: Could not reset git history:", error.message);
    console.log("You may need to manually initialize git.");
  }
}

/**
 * Install dependencies before running the script
 */
async function installDependencies() {
  console.log("Installing dependencies...\n");
  try {
    execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
    console.log("");
  } catch (error) {
    console.error("Failed to install dependencies:", error.message);
    process.exit(1);
  }

  // Now that dependencies are installed, load the modules that depend on them
  prompts = await import("./lib/prompts.mjs");
  replacer = await import("./lib/replacer.mjs");
  utils = await import("./lib/utils.mjs");
}

/**
 * Main initialization function
 */
async function main() {
  // Install dependencies first
  await installDependencies();

  console.log("\n========================================");
  console.log("  Electron Boilerplate - Project Setup");
  console.log("========================================\n");

  // Check if already initialized
  if (await isAlreadyInitialized()) {
    const proceed = await prompts.promptAlreadyInitialized();
    if (!proceed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  // Gather user inputs
  const projectName = await prompts.promptProjectName();
  const defaultProductName = utils.toTitleCase(projectName);
  const productName = await prompts.promptProductName(defaultProductName);
  const description = await prompts.promptDescription();
  const githubOwner = await prompts.promptGitHubOwner();
  const repoVisibility = await prompts.promptRepoVisibility();
  const targetPlatforms = await prompts.promptTargetPlatforms();
  const authorName = await prompts.promptAuthorName();
  const authorEmail = await prompts.promptAuthorEmail();
  const version = await prompts.promptVersion();
  const resetGit = await prompts.promptResetGit();

  // Generate derived values
  const appId = utils.generateAppId(projectName, githubOwner);
  const isPrivate = repoVisibility === "private";

  // Display summary
  console.log("\n----------------------------------------");
  console.log("  Configuration Summary");
  console.log("----------------------------------------");
  console.log(`  Project name:    ${projectName}`);
  console.log(`  Product name:    ${productName}`);
  console.log(`  Description:     ${description}`);
  console.log(`  GitHub owner:    ${githubOwner}`);
  console.log(`  Repository:      ${repoVisibility}`);
  console.log(`  Platforms:       ${targetPlatforms.join(", ")}`);
  console.log(`  Author:          ${authorName} <${authorEmail}>`);
  console.log(`  App ID:          ${appId}`);
  console.log(`  Version:         ${version}`);
  console.log(`  Reset git:       ${resetGit ? "Yes" : "No"}`);
  console.log("----------------------------------------\n");

  // Confirm
  const confirmed = await prompts.promptConfirmation();
  if (!confirmed) {
    console.log("Cancelled.");
    process.exit(0);
  }

  console.log("\nInitializing project...\n");

  // Perform updates
  try {
    console.log("Updating package.json...");
    await replacer.updatePackageJson(ROOT, {
      projectName,
      productName,
      description,
      version,
      githubOwner,
      authorName,
      authorEmail,
      appId,
    });

    console.log("Updating electron-builder.yml...");
    await replacer.updateElectronBuilderConfig(ROOT, {
      githubOwner,
      projectName,
      productName,
      isPrivate,
      platforms: targetPlatforms,
    });

    console.log("Updating release.yaml workflow...");
    await replacer.updateReleaseWorkflow(ROOT, {
      isPrivate,
      platforms: targetPlatforms,
    });

    console.log("Updating forge.config.ts...");
    await replacer.updateForgeConfig(ROOT, githubOwner, projectName);

    console.log("Updating index.html...");
    await replacer.updateIndexHtml(ROOT, productName);

    console.log("Updating update-notification.tsx...");
    await replacer.updateNotificationComponent(ROOT, githubOwner, projectName);

    console.log("Updating main.ts (autoUpdater config)...");
    await replacer.updateMainTs(ROOT, githubOwner, projectName);

    console.log("Updating README.md...");
    await replacer.updateReadme(ROOT, productName, description);

    console.log("Updating CLAUDE.md...");
    await replacer.updateClaudeMd(ROOT, productName);

    console.log("Updating hero-section.tsx...");
    await replacer.updateHeroSection(ROOT, productName);

    console.log("Updating base-layout.tsx...");
    await replacer.updateBaseLayout(ROOT, productName);

    console.log("Resetting CHANGELOG.md...");
    await replacer.resetChangelog(ROOT, version, productName);

    if (resetGit) {
      await resetGitHistory(projectName);
    }

    // Remove the init-project script from package.json
    console.log("\nRemoving init-project script...");
    await replacer.removeInitScript(ROOT);

    console.log("\n========================================");
    console.log("  Project initialized successfully!");
    console.log("========================================\n");

    console.log("Next steps:");
    console.log("  1. Review the changes");
    console.log("  2. Run: pnpm install");
    console.log("  3. Run: pnpm run start");

    if (isPrivate) {
      console.log("\n  Private Repository Setup:");
      console.log("  4. Create a GitHub Personal Access Token (PAT):");
      console.log("     - Go to: https://github.com/settings/tokens?type=beta");
      console.log("     - Create a fine-grained token with:");
      console.log("       • Repository access: Only select repositories");
      console.log(
        "       • Permissions: Contents (Read/Write), Metadata (Read)",
      );
      console.log("  5. Add the token as a repository secret:");
      console.log(
        "     - Go to: https://github.com/" +
          githubOwner +
          "/" +
          projectName +
          "/settings/secrets/actions",
      );
      console.log("     - Name: GH_RELEASE_TOKEN");
      console.log("     - Value: Your PAT from step 4");
    }

    console.log("\n  (Optional) Delete the /scripts directory");
    console.log("");
  } catch (error) {
    console.error("\nError during initialization:", error.message);
    console.error("Some files may have been partially updated.");
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
