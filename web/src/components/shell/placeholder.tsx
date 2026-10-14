import type { ReactNode } from "react";

// Lightweight building blocks for the placeholder screens (POWRFIT_NAV_SPEC §5).
// Real content gets wired after the shell is approved.

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-4 pt-5 pb-4 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {hint && (
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>
        )}
        {children}
      </div>
    </div>
  );
}
