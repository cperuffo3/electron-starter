import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, UPDATE_CHANNELS } from "./constants";
import type { UpdateInfo, DownloadProgress } from "./ipc/updater/types";

// Forward oRPC server port
window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});

// Expose update event listeners to renderer
const updateAPI = {
  onUpdateChecking: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(UPDATE_CHANNELS.CHECKING, handler);
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.CHECKING, handler);
  },
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: UpdateInfo) =>
      callback(info);
    ipcRenderer.on(UPDATE_CHANNELS.AVAILABLE, handler);
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.AVAILABLE, handler);
  },
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: UpdateInfo) =>
      callback(info);
    ipcRenderer.on(UPDATE_CHANNELS.NOT_AVAILABLE, handler);
    return () =>
      ipcRenderer.removeListener(UPDATE_CHANNELS.NOT_AVAILABLE, handler);
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: UpdateInfo) =>
      callback(info);
    ipcRenderer.on(UPDATE_CHANNELS.DOWNLOADED, handler);
    return () =>
      ipcRenderer.removeListener(UPDATE_CHANNELS.DOWNLOADED, handler);
  },
  onUpdateProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      progress: DownloadProgress,
    ) => callback(progress);
    ipcRenderer.on(UPDATE_CHANNELS.PROGRESS, handler);
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.PROGRESS, handler);
  },
  onUpdateError: (callback: (error: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, error: string) =>
      callback(error);
    ipcRenderer.on(UPDATE_CHANNELS.ERROR, handler);
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.ERROR, handler);
  },
};

contextBridge.exposeInMainWorld("updateAPI", updateAPI);
