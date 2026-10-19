"use client";

import { Download, Share } from "lucide-react";

import { useRecentWorkouts } from "@/components/workout/use-workout-logs";
import { INSTALL_AFTER_WORKOUTS, installCardKind } from "@/lib/install";
import { dismissInstall, promptInstall, useInstallState } from "./install-prompt";

// Home's "add PowrFit to your home screen" card (P4-07, D26), shown from the
// 2nd finished workout until it's installed or the user says "Not now".
export function InstallCard() {
  const install = useInstallState();
  const { items } = useRecentWorkouts(INSTALL_AFTER_WORKOUTS);
  const finishedWorkouts = items.filter((item) => "log" in item && item.status !== "failed").length;
  const kind = installCardKind({ finishedWorkouts, ...install });
  if (!kind) return null;

  return (
    <section
      aria-labelledby="install-heading"
      className="rounded-2xl border border-accent/40 bg-surface-active p-4"
    >
      <h2 id="install-heading" className="font-bold">
        Add PowrFit to your home screen
      </h2>
      {kind === "ios" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          It opens full screen, like an app. In Safari, tap{" "}
          <Share className="inline size-4 align-text-bottom text-foreground" aria-label="Share" /> Share,
          then <span className="font-semibold text-foreground">Add to Home Screen</span>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          It opens in its own window, like an app, and works offline.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {kind === "prompt" && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-bold text-accent-foreground"
          >
            <Download className="size-4" aria-hidden />
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismissInstall}
          className="flex h-11 items-center rounded-full border border-border px-5 font-semibold text-foreground hover:bg-surface-raised"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
