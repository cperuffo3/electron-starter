import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { ipc } from "@/ipc/manager";
import { Button } from "@/components/ui/button";
import type { UpdateInfo, DownloadProgress } from "@/ipc/updater/types";

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date"
  | "not-configured";

type ErrorType =
  | "version-fetch"
  | "config-missing"
  | "network"
  | "no-releases"
  | "dev-mode"
  | "generic";

interface ErrorDetails {
  type: ErrorType;
  friendlyMessage: string;
  suggestion: string;
}

interface UpdateContextValue {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  errorDetails: ErrorDetails | null;
  isPortable: boolean;
  dismissed: boolean;
  showDetails: boolean;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  dismiss: () => void;
  toggleDetails: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

function classifyError(errorMessage: string): ErrorDetails {
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

// Provider component that manages update state
export function UpdateNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [isPortable, setIsPortable] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    ipc.client.updater
      .isPortable()
      .then(setIsPortable)
      .catch(() => {});

    // Subscribe to update events
    const unsubChecking = window.updateAPI.onUpdateChecking(() => {
      setState("checking");
      setDismissed(false);
      setError(null);
      setErrorDetails(null);
    });

    const unsubAvailable = window.updateAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setState("available");
      setDismissed(false);
    });

    const unsubNotAvailable = window.updateAPI.onUpdateNotAvailable(() => {
      setState("up-to-date");
      setTimeout(() => setState("idle"), 3000);
    });

    const unsubDownloaded = window.updateAPI.onUpdateDownloaded((info) => {
      setUpdateInfo(info);
      setState("ready");
    });

    const unsubProgress = window.updateAPI.onUpdateProgress((prog) => {
      setProgress(prog);
      setState("downloading");
    });

    const unsubError = window.updateAPI.onUpdateError((err) => {
      setError(err);
      setErrorDetails(classifyError(err));
      setState("error");
    });

    return () => {
      unsubChecking();
      unsubAvailable();
      unsubNotAvailable();
      unsubDownloaded();
      unsubProgress();
      unsubError();
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    setState("checking");
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);
    setDismissed(false);

    try {
      const result = await ipc.client.updater.checkForUpdates();
      if (result && !result.success && result.error) {
        setError(result.error);
        setErrorDetails(classifyError(result.error));
        setState("error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to check for updates";
      setError(errorMsg);
      setErrorDetails(classifyError(errorMsg));
      setState("error");
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    setState("downloading");
    setProgress({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 });
    setError(null);
    setErrorDetails(null);

    try {
      const result = await ipc.client.updater.downloadUpdate();
      if (result && !result.success && result.error) {
        setError(result.error);
        setErrorDetails(classifyError(result.error));
        setState("error");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Download failed";
      setError(errorMsg);
      setErrorDetails(classifyError(errorMsg));
      setState("error");
    }
  }, []);

  const installUpdate = useCallback(() => {
    ipc.client.updater.installUpdate();
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setShowDetails(false);
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  const value: UpdateContextValue = {
    state,
    updateInfo,
    progress,
    error,
    errorDetails,
    isPortable,
    dismissed,
    showDetails,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismiss,
    toggleDetails,
  };

  return (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  );
}

// Hook to access update state from context
export function useUpdateNotification() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error(
      "useUpdateNotification must be used within UpdateNotificationProvider",
    );
  }
  return context;
}

interface UpdateNotificationProps {
  version: string;
}

export function UpdateNotification({ version }: UpdateNotificationProps) {
  const {
    state,
    updateInfo,
    progress,
    error,
    errorDetails,
    isPortable,
    dismissed,
    showDetails,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismiss,
    toggleDetails,
  } = useUpdateNotification();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Don't show notification when idle or dismissed
  if (dismissed || state === "idle") {
    return null;
  }

  // Portable mode - show manual download link
  if (isPortable && state === "available") {
    return (
      <div className="bg-popover text-popover-foreground animate-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 max-w-xs rounded-xl border p-4 shadow-lg">
        <div className="mb-2 flex items-start justify-between">
          <strong className="text-sm font-medium">Update Available</strong>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
          >
            &times;
          </button>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">
          Version {updateInfo?.version} is available.
          <br />
          <span className="text-xs text-yellow-500">
            Portable mode: Please download manually.
          </span>
        </p>
        <Button size="sm" asChild>
          <a
            href="https://github.com/cperuffo3/electron-starter/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Release
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-popover text-popover-foreground animate-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 max-w-xs rounded-xl border p-4 shadow-lg">
      {/* Header with dismiss button */}
      {(state === "available" ||
        state === "downloading" ||
        state === "ready" ||
        state === "error" ||
        state === "not-configured") && (
        <div className="mb-2 flex items-start justify-between">
          <strong className="text-sm font-medium">
            {state === "available" && "Update Available"}
            {state === "downloading" && "Downloading Update"}
            {state === "ready" && "Ready to Install"}
            {state === "error" &&
              (errorDetails?.friendlyMessage || "Update Error")}
            {state === "not-configured" && "Updater Not Configured"}
          </strong>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Checking state */}
      {state === "checking" && (
        <div className="flex items-center gap-3">
          <div className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-sm">Checking for updates...</span>
        </div>
      )}

      {/* Up-to-date state */}
      {state === "up-to-date" && (
        <div className="flex items-center gap-3">
          <span className="text-lg text-green-500">&#10003;</span>
          <span className="text-sm">You're up to date! (v{version})</span>
        </div>
      )}

      {/* Available state */}
      {state === "available" && (
        <>
          <p className="text-muted-foreground mb-3 text-sm">
            Version {updateInfo?.version} is available.
            {updateInfo?.releaseName && (
              <span className="text-muted-foreground mt-1 block text-xs">
                {updateInfo.releaseName}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={downloadUpdate} className="flex-1">
              Download
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Later
            </Button>
          </div>
        </>
      )}

      {/* Downloading state */}
      {state === "downloading" && progress && (
        <>
          <div className="mb-3">
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              {progress.total > 0 ? (
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              ) : (
                <div className="bg-primary h-full w-1/3 animate-pulse" />
              )}
            </div>
          </div>
          <div className="text-muted-foreground flex justify-between text-xs">
            {progress.total > 0 ? (
              <>
                <span>{progress.percent.toFixed(0)}%</span>
                <span>
                  {formatBytes(progress.transferred)} /{" "}
                  {formatBytes(progress.total)}
                </span>
              </>
            ) : (
              <span>Downloading...</span>
            )}
          </div>
        </>
      )}

      {/* Ready state */}
      {state === "ready" && (
        <>
          <p className="text-muted-foreground mb-3 text-sm">
            Version {updateInfo?.version} is ready to install.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={installUpdate}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Restart Now
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Later
            </Button>
          </div>
        </>
      )}

      {/* Error state */}
      {state === "error" && errorDetails && (
        <>
          <p className="text-muted-foreground mb-2 text-sm">
            {errorDetails.suggestion}
          </p>

          {/* Show/hide raw error details */}
          {error && (
            <div className="mb-3">
              <button
                onClick={toggleDetails}
                className="text-muted-foreground hover:text-foreground text-xs underline"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
              {showDetails && (
                <pre className="bg-muted text-destructive mt-2 max-h-24 overflow-auto rounded p-2 text-xs">
                  {error}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={checkForUpdates}
              className="flex-1"
            >
              Retry
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Dismiss
            </Button>
          </div>
        </>
      )}

      {/* Fallback error state (no errorDetails) */}
      {state === "error" && !errorDetails && (
        <>
          <p className="text-destructive mb-3 text-sm">
            {error || "Failed to check for updates."}
          </p>
          <Button size="sm" variant="secondary" onClick={checkForUpdates}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
