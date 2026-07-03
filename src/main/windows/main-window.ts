import { BrowserWindow, app } from "electron";
import path from "path";

import { inDevelopment } from "@main/common/env";
import { ipcContext } from "@main/core/context";

function getIconPath() {
  if (inDevelopment) {
    // In dev, assets are at the project root
    return path.join(__dirname, "../../assets/icons/icon.png");
  }
  // In production, extraResource places assets in the resources folder
  return path.join(process.resourcesPath, "assets/icons/icon.png");
}

export function createMainWindow() {
  const preload = path.join(__dirname, "../preload/index.js");
  const mainWindow = new BrowserWindow({
    width: 1540,
    height: 1080,
    icon: getIconPath(),
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });
  ipcContext.setMainWindow(mainWindow);

  if (!app.isPackaged) {
    mainWindow.loadURL(
      process.env.ELECTRON_RENDERER_URL ?? "http://localhost:5173",
    );
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Open DevTools in a separate window in development mode
  if (inDevelopment) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  return mainWindow;
}
