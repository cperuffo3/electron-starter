import type {
  UpdateCheckResult,
  UpdateDownloadResult,
} from "@shared/types/updater";

import { ipc } from "@/lib/ipc-client";

export function checkForUpdates(): Promise<UpdateCheckResult> {
  return ipc.client.updater.checkForUpdates();
}

export function downloadUpdate(): Promise<UpdateDownloadResult> {
  return ipc.client.updater.downloadUpdate();
}

export function installUpdate(): Promise<void> {
  return ipc.client.updater.installUpdate();
}

export function isPortable(): Promise<boolean> {
  return ipc.client.updater.isPortable();
}
