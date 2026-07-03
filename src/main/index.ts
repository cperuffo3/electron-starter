import { app, BrowserWindow } from "electron";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { loadEnv } from "@main/common/env";
import { registerRpcServer } from "@main/core/rpc-server";
import { setupAutoUpdater } from "@main/integrations/updater/auto-updater";
import { createMainWindow } from "@main/windows/main-window";

loadEnv();

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

app
  .whenReady()
  .then(createMainWindow)
  .then(installExtensions)
  .then(setupAutoUpdater)
  .then(registerRpcServer);

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
//osX only ends
