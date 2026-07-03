export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date"
  | "not-configured";

export type UpdateErrorType =
  | "version-fetch"
  | "config-missing"
  | "network"
  | "no-releases"
  | "dev-mode"
  | "generic";

export interface UpdateErrorDetails {
  type: UpdateErrorType;
  friendlyMessage: string;
  suggestion: string;
}
