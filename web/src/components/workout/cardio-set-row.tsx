"use client";

import { Check, X } from "lucide-react";

import { canCompleteSet, type CardioField, type DistanceUnit, type DraftCardioSet } from "@/lib/strength";
import { cn } from "@/lib/utils";
import { formatCardioTime, parseDecimalInput, parseDurationInput, parseRepsInput } from "@/lib/workout/format";
import { NumberField } from "./set-row";

// Cardio sets (2026-11-02): a time, plus the stats the machine shows. Shared
// by the logger and the history editor.

type FieldInfo = {
  label: string;
  placeholder: (distanceUnit: DistanceUnit) => string;
  parse: (text: string) => number | null | undefined;
  inputMode: "decimal" | "numeric";
};

const FIELDS: Record<CardioField, FieldInfo> = {
  distance: { label: "Distance", placeholder: (unit) => unit, parse: (text) => parseDecimalInput(text, 200), inputMode: "decimal" },
  level: { label: "Level", placeholder: () => "level", parse: (text) => parseDecimalInput(text, 100), inputMode: "decimal" },
  floors: { label: "Floors", placeholder: () => "floors", parse: parseRepsInput, inputMode: "numeric" },
  inclinePct: { label: "Incline", placeholder: () => "%", parse: (text) => parseDecimalInput(text, 40), inputMode: "decimal" },
  calories: { label: "Calories", placeholder: () => "cal", parse: parseRepsInput, inputMode: "numeric" },
};

export type CardioValues = Partial<Record<CardioField | "durationSec", number | null>>;

/** The time field: minutes ("20"), or "20:30", or "1:05:00". */
export function CardioTimeField({
  value,
  onValue,
  label,
}: {
  value: number | null;
  onValue: (value: number | null) => void;
  label: string;
}) {
  return (
    <NumberField
      value={value}
      parse={parseDurationInput}
      format={formatCardioTime}
      onValue={onValue}
      label={label}
      placeholder="min"
      inputMode="text"
    />
  );
}

/** The machine's stats, labelled, two to a row. */
export function CardioStatFields({
  fields,
  values,
  distanceUnit,
  labelPrefix,
  onValue,
}: {
  fields: readonly CardioField[];
  values: CardioValues;
  distanceUnit: DistanceUnit;
  /** Starts each field's accessible name, e.g. "Stair climber set 1". */
  labelPrefix: string;
  onValue: (field: CardioField, value: number | null) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {fields.map((field) => {
        const info = FIELDS[field];
        const unit = field === "distance" ? ` in ${distanceUnit}` : field === "inclinePct" ? " in percent" : "";
        return (
          <label key={field} className="flex flex-col gap-1 text-caption font-medium text-muted-foreground">
            <span aria-hidden>{info.label}</span>
            <NumberField
              value={values[field] ?? null}
              parse={info.parse}
              onValue={(value) => onValue(field, value)}
              label={`${labelPrefix} ${info.label.toLowerCase()}${unit}`}
              placeholder={info.placeholder(distanceUnit)}
              inputMode={info.inputMode}
            />
          </label>
        );
      })}
    </div>
  );
}

/** One cardio set in the logger: time, done and remove, with the stats below. */
export function CardioSetRow({
  index,
  set,
  exerciseName,
  fields,
  onChange,
  onToggle,
  onRemove,
}: {
  index: number;
  set: DraftCardioSet;
  exerciseName: string;
  fields: readonly CardioField[];
  onChange: (patch: CardioValues) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  const completable = canCompleteSet(set);
  const prefix = `${exerciseName} set ${number}`;

  return (
    <li className={cn("flex flex-col gap-2 rounded-tile px-1 py-1", set.done && "bg-accent-muted")}>
      <div className="type-cap grid grid-cols-[2rem_1fr_3rem_2.75rem] items-center gap-2">
        <span className="text-center tabular-nums text-footnote text-muted-foreground" aria-hidden>
          {number}
        </span>
        <CardioTimeField
          value={set.durationSec}
          onValue={(durationSec) => onChange({ durationSec })}
          label={`${prefix} time`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={set.done}
          aria-label={`Set ${number} ${set.done ? "done" : "not done"}`}
          title={completable || set.done ? undefined : "Enter a time first"}
          disabled={!set.done && !completable}
          className={cn(
            "flex size-12 items-center justify-center rounded-tile border transition-colors disabled:opacity-40",
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
          className="flex size-11 items-center justify-center rounded-input text-muted-foreground hover:bg-surface hover:text-danger"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="pl-10 pr-1">
        <CardioStatFields
          fields={fields}
          values={set}
          distanceUnit={set.distanceUnit}
          labelPrefix={prefix}
          onValue={(field, value) => onChange({ [field]: value })}
        />
      </div>
    </li>
  );
}
