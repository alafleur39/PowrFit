"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { canCompleteSet, type DraftSet } from "@/lib/strength";
import { cn } from "@/lib/utils";
import { parseRepsInput, parseWeightInput } from "@/lib/workout/format";

const show = (value: number | null) => (value === null ? "" : String(value));

/**
 * A number field that keeps what the user is typing ("62.", "62,5") while
 * only sending valid numbers to the draft. Invalid text is flagged, not
 * silently replaced.
 */
function NumberField({
  value,
  parse,
  onValue,
  label,
  placeholder,
  inputMode,
}: {
  value: number | null;
  parse: (text: string) => number | null | undefined;
  onValue: (value: number | null) => void;
  label: string;
  placeholder?: string;
  inputMode: "decimal" | "numeric";
}) {
  const [text, setText] = useState(show(value));
  const [lastValue, setLastValue] = useState(value);
  // Follow changes made elsewhere (for example a copied set).
  if (value !== lastValue) {
    setLastValue(value);
    if (parse(text) !== value) setText(show(value));
  }
  const invalid = parse(text) === undefined;

  return (
    <input
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      aria-label={label}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parse(event.target.value);
        if (parsed !== undefined) onValue(parsed);
      }}
      onBlur={() => {
        if (!invalid) setText(show(value));
      }}
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-center font-mono text-base tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        invalid && "border-danger focus-visible:border-danger"
      )}
    />
  );
}

export function SetRow({
  index,
  set,
  targetReps,
  onChange,
  onToggle,
  onRemove,
}: {
  index: number;
  set: DraftSet;
  targetReps?: string;
  onChange: (patch: { weight?: number | null; reps?: number | null }) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  const completable = canCompleteSet(set);

  return (
    <li
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_3rem_2.25rem] items-center gap-2 rounded-xl px-1 py-1",
        set.done && "bg-surface-active"
      )}
    >
      <span className="text-center font-mono text-sm text-muted-foreground" aria-hidden>
        {number}
      </span>
      <NumberField
        value={set.weight}
        parse={parseWeightInput}
        onValue={(weight) => onChange({ weight })}
        label={`Set ${number} weight in ${set.unit}`}
        placeholder={set.unit}
        inputMode="decimal"
      />
      <NumberField
        value={set.reps}
        parse={parseRepsInput}
        onValue={(reps) => onChange({ reps })}
        label={`Set ${number} reps`}
        placeholder={targetReps ? `${targetReps} reps` : "reps"}
        inputMode="numeric"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={set.done}
        aria-label={`Set ${number} ${set.done ? "done" : "not done"}`}
        title={completable || set.done ? undefined : "Enter weight and reps first"}
        disabled={!set.done && !completable}
        className={cn(
          "flex size-12 items-center justify-center rounded-xl border transition-colors disabled:opacity-40",
          set.done
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-muted-foreground hover:text-foreground"
        )}
      >
        <Check className="size-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove set ${number}`}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-danger"
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}
