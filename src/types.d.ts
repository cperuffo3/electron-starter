// Type declarations for electron-vite and application-specific types

// Update API types exposed via contextBridge
import type { UpdateInfo, DownloadProgress } from "./ipc/updater/types";

interface UpdateAPI {
  onUpdateChecking(callback: () => void): () => void;
  onUpdateAvailable(callback: (info: UpdateInfo) => void): () => void;
  onUpdateNotAvailable(callback: (info: UpdateInfo) => void): () => void;
  onUpdateDownloaded(callback: (info: UpdateInfo) => void): () => void;
  onUpdateProgress(callback: (progress: DownloadProgress) => void): () => void;
  onUpdateError(callback: (error: string) => void): () => void;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ELECTRON_RENDERER_URL?: string;
      NODE_ENV: "development" | "production";
    }
  }

  interface Window {
    updateAPI: UpdateAPI;
  }
}

export {};
