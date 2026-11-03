import type { ReactNode } from "react";

// The top of a screen (UI playbook Phase 2): its title, an optional line
// that tells the user something they need (not a slogan), and an optional
// action on the right.
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-title2 font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-footnote text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
