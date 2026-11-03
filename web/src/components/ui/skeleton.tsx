import { cn } from "@/lib/utils";

// A placeholder block while content loads (UI playbook Phase 2), shaped like
// what's coming. It pulses unless Reduce Motion is on. Hidden from VoiceOver:
// the region it sits in should say aria-busy instead.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("rounded-tile bg-surface-raised motion-safe:animate-pulse", className)} />;
}
