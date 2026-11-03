import { cn } from "@/lib/utils";

import { BOLT_MARK, WORDMARK_BOLT, WORDMARK_LETTERS, WORDMARK_VIEWBOX } from "./wordmark-paths";

// The brand (UI playbook Phase 3). The wordmark is outlined letters in the
// text colour with one yellow bolt; flat colour only, no glow. In text the
// name is written "PowrFit"; the logo's capitals are lettering.
/** `title=""` when the name is already said nearby: the logo is then hidden from VoiceOver. */
export function PowrFitLogo({ className, title = "PowrFit" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={cn("h-6 w-auto", className)}
    >
      <path d={WORDMARK_LETTERS} className="fill-foreground" />
      <path d={WORDMARK_BOLT} className="fill-accent" />
    </svg>
  );
}

/** The bolt on its own, e.g. inside the app icon tile. */
export function BoltMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1 1" aria-hidden className={cn("size-6", className)}>
      <path d={BOLT_MARK} className="fill-current" />
    </svg>
  );
}
