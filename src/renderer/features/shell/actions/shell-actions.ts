import { ipc } from "@/lib/ipc-client";

export function openExternalLink(url: string): Promise<void> {
  return ipc.client.shell.openExternalLink({ url });
}
