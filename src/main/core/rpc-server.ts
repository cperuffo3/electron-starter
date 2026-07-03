import { RPCHandler } from "@orpc/server/message-port";
import { ipcMain } from "electron";

import { IPC_CHANNELS } from "@shared/constants";

import { router } from "./router";

const rpcHandler: RPCHandler<Record<never, never>> = new RPCHandler(router);

/**
 * Listen for the renderer's MessagePort handshake and upgrade it to an
 * oRPC server connection.
 */
export function registerRpcServer() {
  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}
