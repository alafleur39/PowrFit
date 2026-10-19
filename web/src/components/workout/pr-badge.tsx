import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

/** A personal-record chip (P4-03). */
export function PrBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent",
        className
      )}
    >
      <Trophy className="size-3" aria-hidden />
      {label}
    </span>
  );
}
