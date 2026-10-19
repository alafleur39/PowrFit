"use client";

import Link from "next/link";
import { useState } from "react";
import { ListPlus } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ROUTINE_LIMITS, routineFromWorkout, type WorkoutLog } from "@/lib/strength";
import { saveRoutine } from "@/lib/workout/routine-repo";
import { Dialog } from "./dialog";

// "Save as routine" on the workout summary (P4-02): repeats this workout's
// exercises and set counts as a routine in My routines.
export function SaveAsRoutine({ log }: { log: WorkoutLog }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(log.routineName ?? "My workout");
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasDoneSets = log.exercises.some((exercise) => exercise.sets.some((set) => set.done));
  if (!hasDoneSets) return null;

  const save = () => {
    if (!user || name.trim() === "") return;
    const routine = routineFromWorkout(log, {
      id: crypto.randomUUID(),
      now: new Date().toISOString(),
      name: name.trim(),
    });
    setFailed(false);
    // Not awaited: offline, the write waits in the cache until it syncs.
    saveRoutine(user.uid, routine).catch(() => {
      setSaved(false);
      setFailed(true);
    });
    setSaved(true);
    setOpen(false);
  };

  return (
    <div className="mx-4 mt-4 sm:mx-6">
      {saved ? (
        <p role="status" className="text-sm text-success">
          Saved to{" "}
          <Link href="/workouts" className="font-semibold underline underline-offset-2">
            My routines
          </Link>
          .
        </p>
      ) : (
        <Button
          variant="outline"
          className="h-11 border-border bg-transparent font-semibold text-foreground hover:bg-surface"
          onClick={() => setOpen(true)}
        >
          <ListPlus className="size-4" aria-hidden />
          Save as routine
        </Button>
      )}
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Couldn&apos;t save the routine. Try again.
        </p>
      )}

      <Dialog
        open={open}
        title="Save as routine"
        onClose={() => setOpen(false)}
        footer={
          <Button className="h-12 w-full text-base font-bold" disabled={name.trim() === ""} onClick={save}>
            Save routine
          </Button>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Routine name</span>
          <input
            value={name}
            maxLength={ROUTINE_LIMITS.name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none"
          />
        </label>
        <p className="mt-2 text-sm text-muted-foreground">
          Uses this workout&apos;s exercises, in order, with one target set per finished set.
        </p>
      </Dialog>
    </div>
  );
}
