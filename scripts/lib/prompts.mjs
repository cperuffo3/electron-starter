import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { validateProjectName, validateGitHubOwner } from "./utils.mjs";

/**
 * Version options for initial project version
 */
const VERSION_CHOICES = [
  {
    name: "0.1.0 (pre-release)",
    value: "0.1.0",
    description: "Start at 0.1.0 for projects still in development",
  },
  {
    name: "1.0.0 (stable)",
    value: "1.0.0",
    description: "Start at 1.0.0 for production-ready projects",
  },
];

/**
 * Repository visibility options
 */
const REPO_VISIBILITY_CHOICES = [
  {
    name: "Public",
    value: "public",
    description:
      "Public GitHub repository (uses GITHUB_TOKEN for auto-updates)",
  },
  {
    name: "Private",
    value: "private",
    description: "Private GitHub repository (requires GH_RELEASE_TOKEN secret)",
  },
];

/**
 * Platform build target options
 */
const PLATFORM_CHOICES = [
  {
    name: "Windows",
    value: "windows",
    checked: true,
  },
  {
    name: "macOS",
    value: "macos",
    checked: true,
  },
  {
    name: "Linux",
    value: "linux",
    checked: true,
  },
];

/**
 * Prompt for project name
 * @returns {Promise<string>}
 */
export async function promptProjectName() {
  return input({
    message: "Project name (lowercase, hyphens allowed):",
    validate: validateProjectName,
  });
}

/**
 * Prompt for product name (display name for the app)
 * @param {string} defaultName - Default product name based on project name
 * @returns {Promise<string>}
 */
export async function promptProductName(defaultName) {
  return input({
    message: "Product name (display name for the app):",
    default: defaultName,
    validate: (name) => {
      if (!name || name.length === 0) {
        return "Product name is required";
      }
      if (name.length > 100) {
        return "Product name must be 100 characters or less";
      }
      return true;
    },
  });
}

/**
 * Prompt for app description
 * @returns {Promise<string>}
 */
export async function promptDescription() {
  return input({
    message: "App description:",
    default: "An Electron desktop application",
    validate: (desc) => {
      if (desc.length > 200) {
        return "Description must be 200 characters or less";
      }
      return true;
    },
  });
}

/**
 * Prompt for GitHub owner (username or org)
 * @returns {Promise<string>}
 */
export async function promptGitHubOwner() {
  return input({
    message: "GitHub owner (username or organization):",
    validate: validateGitHubOwner,
  });
}

/**
 * Prompt for author name
 * @returns {Promise<string>}
 */
export async function promptAuthorName() {
  return input({
    message: "Author name:",
    validate: (name) => {
      if (!name || name.length === 0) {
        return "Author name is required";
      }
      return true;
    },
  });
}

/**
 * Prompt for author email
 * @returns {Promise<string>}
 */
export async function promptAuthorEmail() {
  return input({
    message: "Author email:",
    validate: (email) => {
      if (!email || email.length === 0) {
        return "Author email is required";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address";
      }
      return true;
    },
  });
}

/**
 * Prompt for initial version
 * @returns {Promise<string>}
 */
export async function promptVersion() {
  return select({
    message: "Initial version:",
    choices: VERSION_CHOICES,
  });
}

/**
 * Prompt for git history reset
 * @returns {Promise<boolean>}
 */
export async function promptResetGit() {
  return confirm({
    message: "Reset git history? (Creates fresh initial commit)",
    default: true,
  });
}

/**
 * Prompt for confirmation to proceed
 * @returns {Promise<boolean>}
 */
export async function promptConfirmation() {
  return confirm({
    message: "Proceed with initialization?",
    default: true,
  });
}

/**
 * Prompt for already initialized warning
 * @returns {Promise<boolean>}
 */
export async function promptAlreadyInitialized() {
  return confirm({
    message: "This project appears to be already initialized. Continue anyway?",
    default: false,
  });
}

/**
 * Prompt for repository visibility
 * @returns {Promise<'public'|'private'>}
 */
export async function promptRepoVisibility() {
  return select({
    message: "Is this a public or private GitHub repository?",
    choices: REPO_VISIBILITY_CHOICES,
    default: "public",
  });
}

/**
 * Prompt for target platforms
 * @returns {Promise<string[]>}
 */
export async function promptTargetPlatforms() {
  return checkbox({
    message: "Select platforms to build for:",
    choices: PLATFORM_CHOICES,
    validate: (answer) => {
      if (answer.length === 0) {
        return "You must select at least one platform";
      }
      return true;
    },
  });
}
