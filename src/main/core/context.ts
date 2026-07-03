import { os } from "@orpc/server";
import { BrowserWindow } from "electron";

class IPCContext {
  public mainWindow: BrowserWindow | undefined;

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  public get mainWindowContext() {
    // The window check happens per-request, not at middleware creation, so
    // handler modules can be imported before the window exists.
    return os.middleware(({ next }) => {
      if (!this.mainWindow) {
        throw new Error("Main window is not set in IPC context.");
      }

      return next({
        context: {
          window: this.mainWindow,
        },
      });
    });
  }
}

export const ipcContext = new IPCContext();
