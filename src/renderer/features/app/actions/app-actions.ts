import { ipc } from "@/lib/ipc-client";

export function getPlatform(): Promise<NodeJS.Platform> {
  return ipc.client.app.currentPlatform();
}

export function getAppVersion(): Promise<string> {
  return ipc.client.app.appVersion();
}
