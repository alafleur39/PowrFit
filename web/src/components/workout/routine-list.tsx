"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Pencil, Plus } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { PRESET_ROUTINES, copyRoutine, type Routine } from "@/lib/strength";
import { saveRoutine } from "@/lib/workout/routine-repo";
import { useActiveWorkout } from "./active-workout-provider";
import { useRoutines } from "./use-routines";

const setCount = (routine: Routine) =>
  routine.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);

function RoutineCard({
  routine,
  pending,
  actions,
}: {
  routine: Routine;
  pending?: boolean;
  actions: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{routine.name}</h3>
          {routine.notes && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{routine.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {plural(routine.exercises.length, "exercise")} · {plural(setCount(routine), "set")}
        {pending && " · Not synced yet"}
      </p>
    </li>
  );
}

function StartButton({ routine, disabled }: { routine: Routine; disabled: boolean }) {
  const router = useRouter();
  const { start } = useActiveWorkout();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Start ${routine.name}`}
      onClick={() => {
        start(routine);
        router.push("/log");
      }}
      className="h-10 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-40"
    >
      Start
    </button>
  );
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const iconButton =
  "flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-raised hover:text-foreground";

// Workouts → Routines (P4-02): the user's own routines, then the built-in
// presets, which can be copied into "My routines" to edit.
export function RoutineList() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft } = useActiveWorkout();
  const { routines, loading, error } = useRoutines();
  const [copyError, setCopyError] = useState(false);
  const busy = Boolean(draft);

  const copy = (preset: Routine) => {
    if (!user) return;
    const routine = copyRoutine(preset, { id: crypto.randomUUID(), now: new Date().toISOString() });
    setCopyError(false);
    // Not awaited: offline, the write waits in the cache until it syncs.
    saveRoutine(user.uid, routine).catch(() => setCopyError(true));
    router.push(`/workouts/routines/${routine.id}`);
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-4 sm:px-6">
      {busy && (
        <p className="text-sm text-muted-foreground">
          Finish or discard your current workout before starting another.
        </p>
      )}

      <section aria-labelledby="my-routines" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="my-routines" className="text-base font-bold">
            My routines
          </h2>
          <Link
            href="/workouts/routines/new"
            className="flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface"
          >
            <Plus className="size-4" aria-hidden />
            New routine
          </Link>
        </div>
        {copyError && (
          <p role="alert" className="text-sm text-danger">
            Couldn&apos;t save the copy. Try again.
          </p>
        )}
        {error ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your routines. Check your connection.
          </p>
        ) : routines.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-center text-sm text-muted-foreground">
            {loading
              ? "Loading your routines…"
              : "No routines yet. Create one, copy a preset below, or save a finished workout as a routine."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {routines.map(({ routine, status }) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                pending={status === "pending"}
                actions={
                  <>
                    <Link
                      href={`/workouts/routines/${routine.id}`}
                      aria-label={`Edit ${routine.name}`}
                      className={iconButton}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                    <StartButton routine={routine} disabled={busy} />
                  </>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="preset-routines" className="flex flex-col gap-3">
        <h2 id="preset-routines" className="text-base font-bold">
          Presets
        </h2>
        <ul className="flex flex-col gap-3">
          {PRESET_ROUTINES.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              actions={
                <>
                  <button
                    type="button"
                    aria-label={`Copy ${routine.name} to my routines`}
                    onClick={() => copy(routine)}
                    className={iconButton}
                  >
                    <Copy className="size-4" aria-hidden />
                  </button>
                  <StartButton routine={routine} disabled={busy} />
                </>
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
