"use client";

import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "info" | "success" | "warning";
type ToastMessage = { id: number; text: string; tone: ToastTone };

const ToastContext = createContext<(text: string, tone?: ToastTone) => void>(() => {});

/** show("Workout saved", "success"): a short message above the tab bar. */
export const useToast = () => useContext(ToastContext);

const DURATION_MS = 3000;

const ICONS = { info: Info, success: CheckCircle2, warning: CircleAlert } as const;
const TONES = { info: "text-muted-foreground", success: "text-success", warning: "text-warning" } as const;

// Toasts (UI playbook Phase 2): one at a time, gone after 3 seconds, read out
// by VoiceOver through a polite live region (no role=status, so it
// doesn't compete with a screen's own status message). For news, not for errors that
// need an action (those stay on screen).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const next = useRef(0);

  const show = useCallback((text: string, tone: ToastTone = "info") => {
    next.current += 1;
    setToast({ id: next.current, text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-60 flex justify-center px-4 md:bottom-6"
      >
        {toast && <Toast key={toast.id} text={toast.text} tone={toast.tone} />}
      </div>
    </ToastContext>
  );
}

export function Toast({ text, tone = "info", className }: { text: string; tone?: ToastTone; className?: string }) {
  const Icon = ICONS[tone];
  return (
    <p
      className={cn(
        "flex max-w-sm items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-3 text-footnote font-semibold text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
        className
      )}
    >
      <Icon className={cn("size-5 shrink-0", TONES[tone])} aria-hidden />
      {text}
    </p>
  );
}
