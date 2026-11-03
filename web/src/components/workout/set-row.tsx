"use client";

import { useState } from "react";
import { Check, Trash2, Trophy } from "lucide-react";

import { canCompleteSet, type DraftStrengthSet } from "@/lib/strength";
import { cn } from "@/lib/utils";
import { parseRepsInput, parseWeightInput } from "@/lib/workout/format";

/**
 * A number field that keeps what the user is typing ("62.", "62,5") while
 * only sending valid numbers to the draft. Invalid text is flagged, not
 * silently replaced. `format` turns a value back into text (cardio times
 * show as "20:00").
 */
export function NumberField({
  value,
  parse,
  format = String,
  onValue,
  label,
  placeholder,
  inputMode,
  onFocus,
  onBlur,
}: {
  onFocus?: () => void;
  onBlur?: () => void;
  value: number | null;
  parse: (text: string) => number | null | undefined;
  format?: (value: number) => string;
  onValue: (value: number | null) => void;
  label: string;
  placeholder?: string;
  inputMode: "decimal" | "numeric" | "text";
}) {
  const show = (shown: number | null) => (shown === null ? "" : format(shown));
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
      onFocus={onFocus}
      onBlur={() => {
        if (!invalid) setText(show(value));
        onBlur?.();
      }}
      className={cn(
        "h-12 w-full min-w-0 rounded-input border border-input bg-background px-3 text-center text-body tabular-nums text-foreground placeholder:text-muted-foreground/60 placeholder:italic focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        invalid && "border-danger focus-visible:border-danger"
      )}
    />
  );
}

/** What tapping ✓ on an empty set fills in: the previous set, or last session's. */
export type SetSuggestion = { weight: number; reps: number };

const WEIGHT_STEP = { lb: 5, kg: 2.5 } as const;

const accessoryButton =
  "flex h-12 min-w-14 items-center justify-center rounded-input border border-border bg-surface-raised px-3 text-body font-semibold tabular-nums text-foreground";

/**
 * The bar shown while one of a set's fields is focused (UI playbook Phase 4),
 * like an iOS keyboard accessory: fixed at the bottom, over the tab bar and
 * rest timer, so nothing in the list moves. Steppers for the focused field,
 * and Remove set, which lives here so it's never next to ✓.
 * pointerdown is cancelled so the field keeps focus and the number pad stays up.
 */
function SetAccessory({
  title,
  less,
  more,
  amount,
  onStep,
  removeLabel,
  onRemove,
}: {
  title: string;
  /** VoiceOver names, e.g. "Take 5 lb off set 2"; they don't repeat a field's name. */
  less: string;
  more: string;
  amount: string;
  onStep: (direction: -1 | 1) => void;
  removeLabel: string;
  onRemove: () => void;
}) {
  const keepFocus = (event: React.PointerEvent) => event.preventDefault();
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:col-span-4 md:border-0 md:bg-transparent md:pb-0">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2 md:px-0 md:py-0">
        <span className="min-w-0 flex-1 truncate text-footnote text-muted-foreground">{title}</span>
        <button type="button" onPointerDown={keepFocus} onClick={() => onStep(-1)} aria-label={less} className={accessoryButton}>
          −{amount}
        </button>
        <button type="button" onPointerDown={keepFocus} onClick={() => onStep(1)} aria-label={more} className={accessoryButton}>
          +{amount}
        </button>
        <button
          type="button"
          onPointerDown={keepFocus}
          onClick={onRemove}
          aria-label={removeLabel}
          className="ml-2 flex size-12 items-center justify-center rounded-input text-danger hover:bg-danger/10"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// One strength set in the logger (UI playbook Phase 4). Big fields for
// sweaty thumbs; the placeholders show what you'd likely lift (the previous
// set, else last session's), and ✓ on an empty set fills those in and ticks
// it: one tap. While a field is focused, an accessory bar at the bottom has
// steppers and Remove set, so a missed ✓ can't delete anything.
export function SetRow({
  index,
  set,
  targetReps,
  suggestion,
  record = false,
  onChange,
  onToggle,
  onRemove,
}: {
  index: number;
  set: DraftStrengthSet;
  targetReps?: string;
  suggestion?: SetSuggestion;
  /** This set is a new personal record (P4-03). */
  record?: boolean;
  onChange: (patch: { weight?: number | null; reps?: number | null }) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  const completable = canCompleteSet(set);
  const fillable = !completable && suggestion !== undefined;
  const [editing, setEditing] = useState<"weight" | "reps" | null>(null);
  const step = WEIGHT_STEP[set.unit];

  const stepWeight = (direction: -1 | 1) => {
    const base = set.weight ?? suggestion?.weight ?? 0;
    onChange({ weight: Math.max(0, Math.round((base + direction * step) * 100) / 100) });
  };
  const stepReps = (direction: -1 | 1) => {
    const base = set.reps ?? suggestion?.reps ?? 0;
    onChange({ reps: Math.max(0, base + direction) });
  };
  const toggle = () => {
    if (!set.done && fillable && suggestion) {
      onChange({ weight: set.weight ?? suggestion.weight, reps: set.reps ?? suggestion.reps });
    }
    onToggle();
  };

  return (
    <li
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-tile px-1 py-1",
        set.done && "bg-accent-muted"
      )}
    >
      {record ? (
        <span className="flex flex-col items-center leading-none" title="New personal record">
          <Trophy className="size-4 text-accent" aria-hidden />
          <span className="mt-0.5 text-caption font-bold text-accent">PR</span>
          <span className="sr-only">Set {number} is a new personal record</span>
        </span>
      ) : (
        <span className="text-center tabular-nums text-footnote text-muted-foreground" aria-hidden>
          {number}
        </span>
      )}
      <NumberField
        value={set.weight}
        parse={parseWeightInput}
        onValue={(weight) => onChange({ weight })}
        label={`Set ${number} weight in ${set.unit}`}
        placeholder={suggestion ? String(suggestion.weight) : "–"}
        inputMode="decimal"
        onFocus={() => setEditing("weight")}
        onBlur={() => setEditing((current) => (current === "weight" ? null : current))}
      />
      <NumberField
        value={set.reps}
        parse={parseRepsInput}
        onValue={(reps) => onChange({ reps })}
        label={`Set ${number} reps`}
        placeholder={suggestion ? String(suggestion.reps) : targetReps ?? "reps"}
        inputMode="numeric"
        onFocus={() => setEditing("reps")}
        onBlur={() => setEditing((current) => (current === "reps" ? null : current))}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={set.done}
        aria-label={`Set ${number} ${set.done ? "done" : "not done"}`}
        title={completable || set.done || fillable ? undefined : "Enter weight and reps first"}
        disabled={!set.done && !completable && !fillable}
        className={cn(
          "flex size-12 items-center justify-center rounded-tile border-2 transition-colors disabled:opacity-40",
          set.done ? "border-accent bg-accent-muted text-accent" : "border-border bg-transparent hover:border-muted-foreground"
        )}
      >
        {set.done && <Check className="size-6" strokeWidth={3} aria-hidden />}
      </button>
      {editing && (
        <SetAccessory
          title={`Set ${number} · ${editing === "weight" ? set.unit : "reps"}`}
          less={editing === "weight" ? `Take ${step} ${set.unit} off set ${number}` : `One rep fewer on set ${number}`}
          more={editing === "weight" ? `Add ${step} ${set.unit} to set ${number}` : `One rep more on set ${number}`}
          amount={editing === "weight" ? String(step) : "1"}
          onStep={editing === "weight" ? stepWeight : stepReps}
          removeLabel={`Remove set ${number}`}
          onRemove={() => {
            setEditing(null);
            onRemove();
          }}
        />
      )}
    </li>
  );
}
