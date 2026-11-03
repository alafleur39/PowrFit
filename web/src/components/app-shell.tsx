"use client";

import { createContext, useCallback, useContext, useState, ViewTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/profile/use-profile";
import { AccountDrawer } from "@/components/shell/account-drawer";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { StatsRail } from "@/components/shell/stats-rail";
import { Button } from "@/components/ui/button";
import { ActiveWorkoutStrip } from "@/components/workout/active-workout-strip";
import { Sheet } from "@/components/ui/sheet";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";

const ShellContext = createContext({ signOut: () => {} });

/** Signs out, warning first when a workout hasn't synced (P2-14). */
export const useSignOut = () => useContext(ShellContext).signOut;

// The navigation shell (POWRFIT_NAV_SPEC §5). X/Twitter layout: a left sidebar
// + right stats rail flank a centered, width-capped content column on desktop.
// On phones (UI playbook Phase 3) there is no top bar: each screen has an iOS
// large title (ScreenHeader) and the bottom tab bar does the navigating.
// Starting a workout is a button on Home and Workouts, not a floating "+".
// Account things (unit, sign out) live on Profile.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { draft, unit, setUnit, hasUnsyncedWork, clearDevice } = useActiveWorkout();
  const [signOutWarning, setSignOutWarning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { profile } = useProfile();
  const accountName = profile.displayName;
  const accountEmail = user?.email ?? "";

  // The FAB and the sidebar CTA both open the logger, which resumes any
  // workout in progress.
  const handleLogWorkout = useCallback(() => {
    router.push("/log");
  }, [router]);

  const finishSignOut = useCallback(async () => {
    setDrawerOpen(false);
    setSignOutWarning(false);
    await signOut();
    router.replace("/login");
  }, [router, signOut]);

  // Unsynced work is per user and stays on the device, but warn first so a
  // shared device isn't left holding someone's workout by surprise (P2-14).
  const handleSignOut = useCallback(() => {
    if (hasUnsyncedWork) {
      setDrawerOpen(false);
      setSignOutWarning(true);
    } else {
      void finishSignOut();
    }
  }, [hasUnsyncedWork, finishSignOut]);

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
            "min-h-dvh w-full min-w-0 flex-1 pt-[env(safe-area-inset-top)] md:border-x md:border-border md:pt-0",
            draft ? "pb-40 md:pb-24" : "pb-24 md:pb-0"
          )}
        >
          {/* A short crossfade between screens (P6-10). Keyed by path, so
              in-page tab switches (?tab=) don't trigger it. */}
          <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
            <div>
              <ShellContext value={{ signOut: handleSignOut }}>{children}</ShellContext>
            </div>
          </ViewTransition>
        </main>

        <StatsRail />
      </div>

      {/* Behind the iOS status bar, so content scrolling up doesn't show through it. */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-background md:hidden" />
      <ActiveWorkoutStrip />
      <BottomTabBar />

      <AccountDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSignOut={handleSignOut}
        accountName={accountName}
        accountEmail={accountEmail}
        unit={unit}
        onUnitChange={setUnit}
      />

      <Sheet
        open={signOutWarning}
        title="Workout not synced yet"
        onClose={() => setSignOutWarning(false)}
        footer={
          <div className="flex flex-col gap-2">
            <Button className="h-12 text-body font-bold" onClick={() => void finishSignOut()}>
              Keep on this device and sign out
            </Button>
            <Button
              variant="destructive"
              className="h-12 text-body"
              onClick={() => {
                clearDevice();
                void finishSignOut();
              }}
            >
              Discard and sign out
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-body text-foreground hover:bg-surface hover:text-foreground"
              onClick={() => setSignOutWarning(false)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <p className="text-footnote text-muted-foreground">
          This device has a workout in progress or a finished workout that hasn&apos;t reached
          your account yet. If you keep it, it comes back when you sign in here again and is
          never shown to anyone else. If you discard it, it&apos;s gone for good.
        </p>
      </Sheet>
    </div>
  );
}
