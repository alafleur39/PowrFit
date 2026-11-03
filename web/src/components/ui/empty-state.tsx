import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// What a screen or section shows when there's nothing yet (UI playbook
// Phase 2): an icon, a title, one line of text and at most one action. It
// should read as "here's what to do", not as an error.
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-6 sm:px-6", className)}>
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface px-6 py-12 text-center">
        {icon && (
          <span aria-hidden className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-raised text-muted-foreground [&_svg]:size-6">
            {icon}
          </span>
        )}
        <p className="text-body font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-xs text-footnote text-muted-foreground">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
