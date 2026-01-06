import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  isPortable,
} from "./handlers";

export const updater = {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  isPortable,
};

export * from "./types";
