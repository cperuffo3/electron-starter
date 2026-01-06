import { app } from "electron";
import { os } from "@orpc/server";
import { autoUpdater } from "electron-updater";
import type { UpdateCheckResult, UpdateDownloadResult } from "./types";

const inDevelopment = process.env.NODE_ENV === "development";

export const checkForUpdates = os.handler(
  async (): Promise<UpdateCheckResult> => {
    // In development, electron-updater skips the check entirely and returns null
    // We need to detect this and return an appropriate error
    if (inDevelopment && !app.isPackaged) {
      return {
        success: false,
        error:
          "Update check skipped: Running in development mode. Updates only work in packaged builds.",
      };
    }

    try {
      const result = await autoUpdater.checkForUpdates();

      // If result is null, the check was skipped (e.g., dev mode without forceDevUpdateConfig)
      if (!result) {
        return {
          success: false,
          error:
            "Update check skipped: Application is not packaged or update config is missing.",
        };
      }

      return {
        success: true,
        data: result.updateInfo
          ? {
              version: result.updateInfo.version,
              releaseDate: result.updateInfo.releaseDate,
              releaseNotes: result.updateInfo.releaseNotes ?? undefined,
              releaseName: result.updateInfo.releaseName ?? undefined,
            }
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

export const downloadUpdate = os.handler(
  async (): Promise<UpdateDownloadResult> => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  },
);

export const installUpdate = os.handler((): void => {
  autoUpdater.quitAndInstall(false, true);
});

export const isPortable = os.handler((): boolean => {
  return !!process.env.PORTABLE_EXECUTABLE_DIR;
});
