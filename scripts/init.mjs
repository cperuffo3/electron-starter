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

import {
  promptAlreadyInitialized,
  promptAuthorEmail,
  promptAuthorName,
  promptConfirmation,
  promptDescription,
  promptGitHubOwner,
  promptProductName,
  promptProjectName,
  promptResetGit,
  promptVersion,
} from "./lib/prompts.mjs";
import {
  removeInitScript,
  updateClaudeMd,
  updateForgeConfig,
  updateIndexHtml,
  updateNotificationComponent,
  updatePackageJson,
  updateReadme,
} from "./lib/replacer.mjs";
import { generateAppId, toTitleCase } from "./lib/utils.mjs";

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
    const titleName = toTitleCase(projectName);
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
 * Main initialization function
 */
async function main() {
  console.log("\n========================================");
  console.log("  Electron Boilerplate - Project Setup");
  console.log("========================================\n");

  // Check if already initialized
  if (await isAlreadyInitialized()) {
    const proceed = await promptAlreadyInitialized();
    if (!proceed) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  // Gather user inputs
  const projectName = await promptProjectName();
  const defaultProductName = toTitleCase(projectName);
  const productName = await promptProductName(defaultProductName);
  const description = await promptDescription();
  const githubOwner = await promptGitHubOwner();
  const authorName = await promptAuthorName();
  const authorEmail = await promptAuthorEmail();
  const version = await promptVersion();
  const resetGit = await promptResetGit();

  // Generate derived values
  const appId = generateAppId(projectName, githubOwner);

  // Display summary
  console.log("\n----------------------------------------");
  console.log("  Configuration Summary");
  console.log("----------------------------------------");
  console.log(`  Project name:    ${projectName}`);
  console.log(`  Product name:    ${productName}`);
  console.log(`  Description:     ${description}`);
  console.log(`  GitHub owner:    ${githubOwner}`);
  console.log(`  Author:          ${authorName} <${authorEmail}>`);
  console.log(`  App ID:          ${appId}`);
  console.log(`  Version:         ${version}`);
  console.log(`  Reset git:       ${resetGit ? "Yes" : "No"}`);
  console.log("----------------------------------------\n");

  // Confirm
  const confirmed = await promptConfirmation();
  if (!confirmed) {
    console.log("Cancelled.");
    process.exit(0);
  }

  console.log("\nInitializing project...\n");

  // Perform updates
  try {
    console.log("Updating package.json...");
    await updatePackageJson(ROOT, {
      projectName,
      productName,
      description,
      version,
      githubOwner,
      authorName,
      authorEmail,
      appId,
    });

    console.log("Updating forge.config.ts...");
    await updateForgeConfig(ROOT, githubOwner, projectName);

    console.log("Updating index.html...");
    await updateIndexHtml(ROOT, productName);

    console.log("Updating update-notification.tsx...");
    await updateNotificationComponent(ROOT, githubOwner, projectName);

    console.log("Updating README.md...");
    await updateReadme(ROOT, productName, description);

    console.log("Updating CLAUDE.md...");
    await updateClaudeMd(ROOT, productName);

    if (resetGit) {
      await resetGitHistory(projectName);
    }

    // Remove the init-project script from package.json
    console.log("\nRemoving init-project script...");
    await removeInitScript(ROOT);

    console.log("\n========================================");
    console.log("  Project initialized successfully!");
    console.log("========================================\n");

    console.log("Next steps:");
    console.log("  1. Review the changes");
    console.log("  2. Run: pnpm install");
    console.log("  3. Run: pnpm run start");
    console.log("  4. (Optional) Delete the /scripts directory");
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
