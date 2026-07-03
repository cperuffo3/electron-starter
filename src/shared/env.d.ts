declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ELECTRON_RENDERER_URL?: string;
      NODE_ENV: "development" | "production";
      GH_TOKEN?: string;
      GITHUB_TOKEN?: string;
      PORTABLE_EXECUTABLE_DIR?: string;
    }
  }
}

export {};
