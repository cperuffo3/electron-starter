import React from "react";
import { Home, Sun, Moon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { DragWindowRegion } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppVersionQuery } from "@/features/app";
import {
  UpdateNotification,
  UpdateNotificationProvider,
  useUpdateNotification,
} from "@/features/updater";

function BaseLayoutContent({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { state, checkForUpdates } = useUpdateNotification();
  const { theme, setTheme } = useTheme();

  const versionQuery = useAppVersionQuery();
  const versionError =
    versionQuery.isError ||
    versionQuery.data === "0.0.0" ||
    versionQuery.data === "";
  const version = versionError ? "?.?.?" : (versionQuery.data ?? "");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  const isChecking = state === "checking";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="Electron Starter" />
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      <footer className="border-border flex h-10 shrink-0 items-center justify-between border-t px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoHome}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
            title="Return to home"
          >
            <Home className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-3" />
            ) : (
              <Moon className="size-3" />
            )}
          </Button>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={isChecking}
          title={
            versionError
              ? "Version not found - Click to check for updates"
              : "Click to check for updates"
          }
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
            versionError
              ? "text-warning hover:bg-warning/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          } ${isChecking ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          {isChecking && <Spinner className="size-3" />}
          {versionError && !isChecking && (
            <span title="Version could not be determined">⚠</span>
          )}
          <span>Version {version || "..."}</span>
        </button>
      </footer>
      <UpdateNotification version={version} />
    </div>
  );
}

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UpdateNotificationProvider>
      <BaseLayoutContent>{children}</BaseLayoutContent>
    </UpdateNotificationProvider>
  );
}
