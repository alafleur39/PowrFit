"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { DESTINATIONS, isDestinationActive } from "./nav-config";

// Mobile-only bottom tab bar (POWRFIT_NAV_SPEC §5). Folds away at md, where the
// Sidebar takes over. Active destination = yellow icon + label (the iOS tint).
// Tapping the tab you're on scrolls back to the top, as in iOS apps.
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {DESTINATIONS.map((item) => {
          const active = isDestinationActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (!active) haptic("selection");
                  if (pathname !== item.href) return;
                  event.preventDefault();
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                }}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-caption font-semibold transition-colors",
                  active
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-6" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
