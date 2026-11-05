"use client";

import { useRef, type KeyboardEvent } from "react";

import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: string };

// An iOS segmented control (UI playbook Phase 2): picks one value that
// filters or sets something on the same screen (Week / Month / Year, kg / lb).
// To switch between sections, use Tabs. A radio group: arrow keys move.
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (next: T) => {
    if (next === value) return;
    haptic("selection");
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + segments.length) % segments.length;
    select(segments[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-tile bg-surface p-1", className)}
    >
      {segments.map((segment, index) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(segment.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "h-11 rounded-input px-3 text-footnote font-semibold transition-colors",
              selected ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
