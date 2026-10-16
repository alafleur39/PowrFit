"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { PowrFitLogo } from "@/components/powrfit-logo";
import { AccountDrawer } from "@/components/shell/account-drawer";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { Fab } from "@/components/shell/fab";
import { Sidebar } from "@/components/shell/sidebar";
import { StatsRail } from "@/components/shell/stats-rail";
import { ActiveWorkoutStrip } from "@/components/workout/active-workout-strip";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";

// The navigation shell (POWRFIT_NAV_SPEC §5). X/Twitter layout: a left sidebar
// + right stats rail flank a centered, width-capped content column on desktop;
// on mobile that collapses to a top bar, bottom tab bar, and a floating FAB.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { draft } = useActiveWorkout();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accountName = user?.displayName ?? "PowrFit Athlete";
  const accountEmail = user?.email ?? "";

  // The FAB and the sidebar CTA both open the logger, which resumes any
  // workout in progress.
  const handleLogWorkout = useCallback(() => {
    router.push("/log");
  }, [router]);

  const handleSignOut = useCallback(async () => {
    setDrawerOpen(false);
    await signOut();
    router.replace("/login");
  }, [router, signOut]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1200px]">
        <Sidebar
          onLogWorkout={handleLogWorkout}
          onOpenAccount={() => setDrawerOpen(true)}
          accountName={accountName}
          accountEmail={accountEmail}
        />

        <main
          className={cn(
            "min-h-dvh w-full min-w-0 flex-1 md:border-x md:border-border",
            draft ? "pb-40 md:pb-24" : "pb-24 md:pb-0"
          )}
        >
          <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center pt-[env(safe-area-inset-top)] justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-xl md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open account menu"
              className="flex size-9 items-center justify-center rounded-full bg-surface-active text-sm font-bold text-accent"
            >
              {accountName.slice(0, 1).toUpperCase()}
            </button>
            <Link href="/home" aria-label="PowrFit home">
              <PowrFitLogo variant="compact" />
            </Link>
            <span className="size-9" aria-hidden />
          </header>

          {children}
        </main>

        <StatsRail />
      </div>

      {/* While a workout is open, the strip replaces the FAB as the way back in. */}
      {!draft && <Fab onClick={handleLogWorkout} />}
      <ActiveWorkoutStrip />
      <BottomTabBar />

      <AccountDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSignOut={handleSignOut}
        accountName={accountName}
        accountEmail={accountEmail}
      />
    </div>
  );
}
