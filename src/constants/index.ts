export const LOCAL_STORAGE_KEYS = {
  LANGUAGE: "lang",
  THEME: "theme",
};

export const IPC_CHANNELS = {
  START_ORPC_SERVER: "start-orpc-server",
};

export const UPDATE_CHANNELS = {
  CHECKING: "update:checking",
  AVAILABLE: "update:available",
  NOT_AVAILABLE: "update:not-available",
  DOWNLOADED: "update:downloaded",
  PROGRESS: "update:progress",
  ERROR: "update:error",
} as const;
