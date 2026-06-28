import { ipc } from "@/ipc/manager";

export function getPlatform(): Promise<NodeJS.Platform> {
  return ipc.client.app.currentPlatfom();
}

export function getAppVersion(): Promise<string> {
  return ipc.client.app.appVersion();
}
