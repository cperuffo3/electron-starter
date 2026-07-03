import { updater } from "@main/integrations/updater";

import { app } from "./app";
import { shell } from "./shell";
import { theme } from "./theme";
import { window } from "./window";

export const router = {
  theme,
  window,
  app,
  shell,
  updater,
};
