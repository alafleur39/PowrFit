import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// One number with its label (UI playbook Phase 2): Home's week, Profile's
// totals, Progress. The unit is smaller than the value so "18,530 lb" fits a
// third of a 375pt phone. `highlight` turns the value yellow: data, not
// decoration, so use it for the one number that matters on the screen.
// Tiles go in a <StatGrid>, a <dl>, so VoiceOver reads label and value as a pair.
export function StatTile({
  label,
  value,
  unit,
  hint,
  highlight = false,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-tile border border-border bg-surface p-3", className)}>
      <dt className="truncate text-caption text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 truncate text-headline font-bold tabular-nums", highlight ? "text-accent" : "text-foreground")}>
        {value}
        {unit && <span className="text-caption font-semibold"> {unit}</span>}
      </dd>
      {hint && <dd className="mt-0.5 truncate text-caption text-muted-foreground">{hint}</dd>}
    </div>
  );
}

export function StatGrid({ label, columns = 2, children, className }: { label: string; columns?: 2 | 3 | 4; children: ReactNode; className?: string }) {
  return (
    <dl
      aria-label={label}
      className={cn("grid gap-3", { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[columns], className)}
    >
      {children}
    </dl>
  );
}
