"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { RoutineEditor } from "@/components/workout/routine-editor";
import { useRoutines } from "@/components/workout/use-routines";
import { newRoutine } from "@/lib/strength";

// /workouts/routines/new creates a routine; any other id edits that routine.
export default function RoutineEditorPage() {
  const { routineId } = useParams<{ routineId: string }>();
  const { routines, loading } = useRoutines();
  const [fresh] = useState(() =>
    newRoutine({ id: crypto.randomUUID(), now: new Date().toISOString() })
  );

  if (routineId === "new") return <RoutineEditor initial={fresh} isNew />;

  const entry = routines.find((candidate) => candidate.routine.id === routineId);
  if (entry) return <RoutineEditor key={entry.routine.id} initial={entry.routine} isNew={false} />;

  return (
    <div className="flex justify-center px-4 py-20 text-center text-sm text-muted-foreground">
      {loading ? (
        <Loader2 className="size-6 animate-spin" aria-label="Loading" />
      ) : (
        <p>This routine isn&apos;t available. It may have been deleted.</p>
      )}
    </div>
  );
}
