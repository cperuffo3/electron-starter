import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useUpdateNotification } from "../hooks/use-update-notification";

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
          <span className="text-warning text-xs">
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
          <Spinner className="text-primary size-5" />
          <span className="text-sm">Checking for updates...</span>
        </div>
      )}

      {/* Up-to-date state */}
      {state === "up-to-date" && (
        <div className="flex items-center gap-3">
          <span className="text-success text-lg">&#10003;</span>
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
              className="bg-success hover:bg-success/90 flex-1 text-white"
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
