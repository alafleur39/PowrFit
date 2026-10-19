"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";

import { EXERCISE_NOTE_LIMIT } from "@/lib/strength";

// A note on one exercise (P5-02, D27). Collapsed to an "Add note" button
// until it's used, so it costs no space on a card that doesn't need it.
export function ExerciseNote({
  exerciseName,
  note,
  onChange,
}: {
  exerciseName: string;
  note: string | undefined;
  onChange: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (note === undefined && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Add a note to ${exerciseName}`}
        className="mt-1 flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      >
        <StickyNote className="size-4" aria-hidden />
        Add note
      </button>
    );
  }

  return (
    <textarea
      aria-label={`Note for ${exerciseName}`}
      value={note ?? ""}
      maxLength={EXERCISE_NOTE_LIMIT}
      rows={2}
      autoFocus={note === undefined}
      placeholder="How did it feel? Form cues, equipment settings…"
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
    />
  );
}
