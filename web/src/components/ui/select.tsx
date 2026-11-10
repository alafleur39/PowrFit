import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// A picker (UI playbook Phase 7). WebKit draws a native <select> at its own
// small height whatever the CSS says, so this drops the native look and
// draws the field like the text inputs: square-ish, at least 44pt tall,
// with a chevron. Tapping it still opens the iOS picker wheel.
// `wrapperClassName` sizes the field (w-full, max-w-full …); `className`
// styles the text.
export function Select({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative inline-flex", wrapperClassName)}>
      <select
        className={cn(
          "min-h-11 w-full min-w-0 appearance-none rounded-input border border-input bg-background pr-9 pl-3 text-body text-foreground focus-visible:border-ring focus-visible:outline-none",
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}
