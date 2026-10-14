"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { PowrFitLogo } from "@/components/powrfit-logo";
import { cn } from "@/lib/utils";
import { DESTINATIONS, isDestinationActive } from "./nav-config";

type SidebarProps = {
  onLogWorkout: () => void;
  onOpenAccount: () => void;
  accountName: string;
  accountEmail: string;
};

// Desktop (md+) left rail (POWRFIT_NAV_SPEC §4/§5): the bottom tab bar folds
// into this — logo, icon+label nav, full-width "Log workout" CTA, account chip.
export function Sidebar({
  onLogWorkout,
  onOpenAccount,
  accountName,
  accountEmail,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border px-3 py-5 md:flex">
      <Link href="/home" className="px-2">
        <PowrFitLogo variant="wordmark" />
      </Link>

      <nav aria-label="Primary" className="mt-6 flex flex-col gap-1">
        {DESTINATIONS.map((item) => {
          const active = isDestinationActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors",
                active
                  ? "bg-surface-active text-accent"
                  : "text-foreground hover:bg-surface"
              )}
            >
              <item.icon className="size-6" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogWorkout}
        className="brand-glow mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-bold text-background transition-transform hover:scale-[1.02] active:scale-95"
      >
        <Plus className="size-5" aria-hidden />
        Log workout
      </button>

      <button
        type="button"
        onClick={onOpenAccount}
        className="mt-auto flex items-center gap-3 rounded-full p-2 text-left transition-colors hover:bg-surface"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-active text-sm font-bold text-accent"
        >
          {accountName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {accountName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {accountEmail}
          </span>
        </span>
      </button>
    </aside>
  );
}
