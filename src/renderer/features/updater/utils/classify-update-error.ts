import type { UpdateErrorDetails } from "../types/updater.types";

export function classifyUpdateError(errorMessage: string): UpdateErrorDetails {
  const lowerError = errorMessage.toLowerCase();

  // Development mode - not an actual error, just informational
  if (
    lowerError.includes("development mode") ||
    lowerError.includes("not packaged")
  ) {
    return {
      type: "dev-mode",
      friendlyMessage: "Development Mode",
      suggestion:
        "Auto-updates are disabled in development. Package the app to test updates.",
    };
  }

  if (
    lowerError.includes("no published versions") ||
    lowerError.includes("cannot find latest version") ||
    lowerError.includes("404") ||
    lowerError.includes("not found")
  ) {
    return {
      type: "no-releases",
      friendlyMessage: "No releases found",
      suggestion:
        "No published releases exist yet. Create a GitHub release to enable auto-updates.",
    };
  }

  if (
    lowerError.includes("getaddrinfo") ||
    lowerError.includes("enotfound") ||
    lowerError.includes("network") ||
    lowerError.includes("etimedout") ||
    lowerError.includes("econnrefused")
  ) {
    return {
      type: "network",
      friendlyMessage: "Network error",
      suggestion: "Check your internet connection and try again.",
    };
  }

  if (
    lowerError.includes("owner") ||
    lowerError.includes("repo") ||
    lowerError.includes("provider") ||
    lowerError.includes("publish configuration")
  ) {
    return {
      type: "config-missing",
      friendlyMessage: "Updater not configured",
      suggestion:
        'Check package.json "build.publish" configuration (owner, repo, provider).',
    };
  }

  if (
    lowerError.includes("token") ||
    lowerError.includes("401") ||
    lowerError.includes("403") ||
    lowerError.includes("unauthorized") ||
    lowerError.includes("forbidden")
  ) {
    return {
      type: "config-missing",
      friendlyMessage: "Authentication failed",
      suggestion:
        "For private repos, ensure GH_TOKEN is set or update-config.json exists.",
    };
  }

  return {
    type: "generic",
    friendlyMessage: "Update check failed",
    suggestion: errorMessage,
  };
}
