import { config } from "dotenv";
import { app } from "electron";
import { existsSync } from "fs";
import path from "path";

export const inDevelopment = process.env.NODE_ENV === "development";
export const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;

/**
 * Load .env from the first location that has one. Must be called before any
 * code that reads process.env secrets (e.g. the auto-updater token).
 */
export function loadEnv() {
  const possibleEnvPaths = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, "../../.env"), // From dist/main back to project root
    path.join(app.getAppPath(), ".env"),
  ];

  for (const envPath of possibleEnvPaths) {
    if (existsSync(envPath)) {
      const result = config({ path: envPath });
      if (!result.error) {
        return;
      }
    }
  }

  if (!app.isPackaged) {
    console.warn("[Dotenv] No .env file found in development");
  }
}
