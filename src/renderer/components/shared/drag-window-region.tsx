import { type ReactNode } from "react";

import { usePlatformQuery } from "@/features/app";
import { closeWindow, maximizeWindow, minimizeWindow } from "@/features/window";

interface DragWindowRegionProps {
  title?: ReactNode;
}

export function DragWindowRegion({ title }: DragWindowRegionProps) {
  const { data: platform } = usePlatformQuery();

  const isMacOS = platform === "darwin";

  return (
    <div className="flex w-full items-stretch justify-between">
      <div className="draglayer w-full">
        {title && !isMacOS && (
          <div className="text-muted-foreground flex flex-1 p-2 text-xs whitespace-nowrap select-none">
            {title}
          </div>
        )}
        {isMacOS && (
          <div className="flex min-h-7 flex-1 p-2 pl-20">
            {/* Reserve space for macOS traffic-light buttons */}
          </div>
        )}
      </div>
      {!isMacOS && <WindowButtons />}
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="flex">
      <button
        title="Minimize"
        type="button"
        className="hover:bg-muted p-2"
        onClick={minimizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="hover:bg-muted p-2"
        onClick={maximizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </button>
      <button
        type="button"
        title="Close"
        className="hover:bg-destructive p-2 hover:text-white"
        onClick={closeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
    </div>
  );
}
