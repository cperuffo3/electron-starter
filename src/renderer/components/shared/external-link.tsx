import { ComponentProps } from "react";

import { openExternalLink } from "@/features/shell";
import { cn } from "@/utils/tailwind";

export function ExternalLink({
  children,
  className,
  href,
  ...props
}: ComponentProps<"a">) {
  function open() {
    if (!href) {
      return;
    }

    openExternalLink(href);
  }

  return (
    <a
      className={cn("cursor-pointer underline", className)}
      {...props}
      onClick={open}
    >
      {children}
    </a>
  );
}
