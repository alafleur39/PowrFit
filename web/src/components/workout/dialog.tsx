"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// Bottom sheet on phones, centred dialog on desktop (design spec §7 "Sheet").
// Escape and the backdrop close it; focus moves into it when it opens and
// back to where it was when it closes.
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input, button:not([data-close]), [href], select, textarea"
    );
    (focusable ?? panelRef.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        data-close
        tabIndex={-1}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[85dvh] w-full flex-col rounded-t-[20px] border border-border bg-surface-raised pb-[env(safe-area-inset-bottom)] md:max-w-lg md:rounded-[20px] md:pb-0",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-close
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  );
}
