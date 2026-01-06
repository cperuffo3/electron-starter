import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncWithLocalTheme } from "./actions/theme";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./utils/routes";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  useEffect(() => {
    syncWithLocalTheme();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
