import React, { useState, useEffect } from "react";
import {
  DragWindowRegion,
  UpdateNotification,
  UpdateNotificationProvider,
  useUpdateNotification,
} from "@/components/shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ipc } from "@/ipc/manager";
import { useTheme } from "next-themes";

function BaseLayoutContent({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<string>("");
  const [versionError, setVersionError] = useState<boolean>(false);
  const navigate = useNavigate();
  const { state, checkForUpdates } = useUpdateNotification();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    ipc.client.app
      .appVersion()
      .then((v) => {
        if (!v || v === "0.0.0") {
          setVersionError(true);
          setVersion("?.?.?");
        } else {
          setVersion(v);
        }
      })
      .catch(() => {
        setVersionError(true);
        setVersion("?.?.?");
      });
  }, []);

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
            <FontAwesomeIcon icon={faHome} className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
            title="Toggle theme"
          >
            <FontAwesomeIcon
              icon={theme === "dark" ? faSun : faMoon}
              className="size-3"
            />
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
              ? "text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          } ${isChecking ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          {isChecking && (
            <div className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
          )}
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
