"use client";

import { useEffect, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ActiveWorkoutProvider } from "@/components/workout/active-workout-provider";

// Client-side guard for everything inside the (app) route group — the web
// equivalent of the Expo tabs layout's Redirect-to-Login pattern.
// Server-side session checks (Firebase Admin + cookies) can layer in later.
export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Usually a split second while Firebase reads the saved session: a plain
  // dark screen (like the launch screen) rather than a flashing spinner.
  if (loading || !user) {
    return (
      <div aria-busy className="flex-1">
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <ActiveWorkoutProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </ActiveWorkoutProvider>
  );
}
