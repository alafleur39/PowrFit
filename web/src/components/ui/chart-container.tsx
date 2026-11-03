import { LineChart } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// The frame every chart sits in (UI playbook Phase 2). It handles the three
// cases a chart has: no data (an empty state), one point (no line to draw
// yet, so say what's needed), and many (the chart). `unit` is shown with the
// title so axis numbers are never bare.
export function ChartContainer({
  title,
  unit,
  count,
  emptyText,
  singleText,
  single,
  children,
  className,
}: {
  title: string;
  unit?: string;
  /** How many data points the chart has. */
  count: number;
  /** Shown with no data, e.g. "Finish a workout to see this chart." */
  emptyText: string;
  /** Shown with one point, e.g. "Log one more session to see a trend." */
  singleText: string;
  /** What to show for the one point (a stat), above singleText. */
  single?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("rounded-card border border-border bg-surface p-4", className)}>
      <h3 className="text-footnote font-semibold text-foreground">
        {title}
        {unit && <span className="font-normal text-muted-foreground"> ({unit})</span>}
      </h3>
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <LineChart className="size-6 text-muted-foreground" aria-hidden />
          <p className="max-w-xs text-footnote text-muted-foreground">{emptyText}</p>
        </div>
      ) : count === 1 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {single}
          <p className="max-w-xs text-footnote text-muted-foreground">{singleText}</p>
        </div>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  );
}
