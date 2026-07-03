// Types for the APIs this preload exposes on `window` via contextBridge.
// Included by tsconfig.web.json so renderer code sees them.
import type { DownloadProgress, UpdateInfo } from "../shared/types/updater";

interface UpdateAPI {
  onUpdateChecking(callback: () => void): () => void;
  onUpdateAvailable(callback: (info: UpdateInfo) => void): () => void;
  onUpdateNotAvailable(callback: (info: UpdateInfo) => void): () => void;
  onUpdateDownloaded(callback: (info: UpdateInfo) => void): () => void;
  onUpdateProgress(callback: (progress: DownloadProgress) => void): () => void;
  onUpdateError(callback: (error: string) => void): () => void;
}

declare global {
  interface Window {
    updateAPI: UpdateAPI;
  }
}

export {};
