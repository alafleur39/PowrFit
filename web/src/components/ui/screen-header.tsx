"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { PowrFitLogo } from "@/components/powrfit-logo";
import { cn } from "@/lib/utils";

// The top of a screen (UI playbook Phases 2–3), as an iOS large title: the
// title scrolls away with the page, and on phones a slim bar with the small
// title fades in once it has. Home shows the wordmark instead of its title
// (the title stays for VoiceOver). An optional line under the title must
// tell the user something they need, and an action can sit on the right.
export function ScreenHeader({
  title,
  subtitle,
  action,
  brand = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Show the wordmark in place of the title (Home only). */
  brand?: boolean;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: "-48px 0px 0px 0px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-4 sm:px-6 md:pt-5">
        <div className="min-w-0">
          {brand ? (
            <h1>
              <span className="sr-only">{title}</span>
              <PowrFitLogo className="h-8" title="" />
            </h1>
          ) : (
            <h1 className="text-title1 font-bold text-foreground">{title}</h1>
          )}
          {subtitle && <p className="mt-1 text-footnote text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div ref={sentinel} aria-hidden />
      <div
        aria-hidden
        className={cn(
          "fixed inset-x-0 top-[env(safe-area-inset-top)] z-20 flex h-11 items-center justify-center border-b border-border bg-background transition-opacity duration-(--duration-fast) md:hidden",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {brand ? <PowrFitLogo className="h-5" title="" /> : <span className="text-body font-semibold">{title}</span>}
      </div>
    </>
  );
}
