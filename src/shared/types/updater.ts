export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string | ReleaseNoteInfo[];
  releaseName?: string;
}

export interface ReleaseNoteInfo {
  version: string;
  note: string | null;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface UpdateCheckResult {
  success: boolean;
  data?: UpdateInfo;
  error?: string;
}

export interface UpdateDownloadResult {
  success: boolean;
  error?: string;
}

export type UpdateEventCallback<T = void> = T extends void
  ? () => void
  : (data: T) => void;
