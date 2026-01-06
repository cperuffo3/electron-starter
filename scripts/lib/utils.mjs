/**
 * Utility functions for the init script
 */

/**
 * Convert a kebab-case string to Title Case with spaces
 * @param {string} str - The input string (e.g., "my-awesome-app")
 * @returns {string} - Title Case with spaces (e.g., "My Awesome App")
 */
export function toTitleCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert a kebab-case string to PascalCase (no spaces)
 * @param {string} str - The input string (e.g., "my-awesome-app")
 * @returns {string} - PascalCase (e.g., "MyAwesomeApp")
 */
export function toPascalCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Validate a project name
 * @param {string} name - The project name to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validateProjectName(name) {
  if (!name || name.length === 0) {
    return "Project name is required";
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return "Use lowercase letters, numbers, and hyphens only (must start with a letter)";
  }
  if (name.length > 50) {
    return "Project name must be 50 characters or less";
  }
  return true;
}

/**
 * Validate a GitHub username/org name
 * @param {string} name - The GitHub username/org name to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export function validateGitHubOwner(name) {
  if (!name || name.length === 0) {
    return "GitHub owner is required";
  }
  // GitHub usernames: alphanumeric with single hyphens, 1-39 chars
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(name)) {
    return "Invalid GitHub username/org name";
  }
  return true;
}

/**
 * Generate app ID from project name (reverse domain notation)
 * @param {string} projectName - The project name (e.g., "my-awesome-app")
 * @param {string} githubOwner - The GitHub owner (e.g., "username")
 * @returns {string} - App ID (e.g., "com.username.my-awesome-app")
 */
export function generateAppId(projectName, githubOwner) {
  return `com.${githubOwner.toLowerCase()}.${projectName}`;
}
