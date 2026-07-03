import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { DownloadProgress, UpdateInfo } from "@shared/types/updater";

import {
  checkForUpdates as checkForUpdatesAction,
  downloadUpdate as downloadUpdateAction,
  installUpdate as installUpdateAction,
  isPortable as isPortableAction,
} from "../actions/updater-actions";
import type { UpdateErrorDetails, UpdateState } from "../types/updater.types";
import { classifyUpdateError } from "../utils/classify-update-error";

interface UpdateContextValue {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  errorDetails: UpdateErrorDetails | null;
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
  const [errorDetails, setErrorDetails] = useState<UpdateErrorDetails | null>(
    null,
  );
  const [isPortable, setIsPortable] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    isPortableAction()
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
      setErrorDetails(classifyUpdateError(err));
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
      const result = await checkForUpdatesAction();
      if (result && !result.success && result.error) {
        setError(result.error);
        setErrorDetails(classifyUpdateError(result.error));
        setState("error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to check for updates";
      setError(errorMsg);
      setErrorDetails(classifyUpdateError(errorMsg));
      setState("error");
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    setState("downloading");
    setProgress({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 });
    setError(null);
    setErrorDetails(null);

    try {
      const result = await downloadUpdateAction();
      if (result && !result.success && result.error) {
        setError(result.error);
        setErrorDetails(classifyUpdateError(result.error));
        setState("error");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Download failed";
      setError(errorMsg);
      setErrorDetails(classifyUpdateError(errorMsg));
      setState("error");
    }
  }, []);

  const installUpdate = useCallback(() => {
    installUpdateAction();
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
