"use client";

import { useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { useHistoryLogs, useRecords } from "@/components/workout/use-records";
import {
  AVATAR_COLORS,
  AVATAR_SWATCH,
  DISPLAY_NAME_MAX,
  profileProblems,
  type AvatarColor,
} from "@/lib/profile";
import { WEIGHT_UNITS, workoutTotals } from "@/lib/strength";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/format";
import { weekStreak } from "@/lib/workout/week-stats";
import { ProfileAvatar } from "./profile-avatar";
import { useProfile } from "./use-profile";

const field =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none";

// The top of Profile (P6-13): who you are, your lifetime numbers and your
// unit. Stats are worked out from history like Progress; nothing new is
// stored. Up to HISTORY_LIMIT recent workouts count (Phase 4 known gap).
export function ProfileCard() {
  const { user } = useAuth();
  const { profile, save } = useProfile();
  const { unit, setUnit } = useActiveWorkout();
  const { logs } = useHistoryLogs();
  const { records } = useRecords();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<AvatarColor>("yellow");
  const [problems, setProblems] = useState<string[]>([]);
  const [now] = useState(() => new Date());

  const stats = useMemo(() => {
    const volume = workoutTotals(logs.flatMap((log) => log.exercises), unit).volume;
    const prs = [...records.values()].reduce((sum, list) => sum + list.length, 0);
    const streak = weekStreak(logs.map((log) => log.endedAt), now);
    return [
      ["Workouts", String(logs.length)],
      ["Total volume", formatWeight(volume, unit)],
      ["PRs", String(prs)],
      ["Week streak", String(streak)],
    ];
  }, [logs, records, unit, now]);

  const startEditing = () => {
    setName(profile.displayName);
    setColor(profile.avatar.color);
    setProblems([]);
    setEditing(true);
  };

  const saveEdit = () => {
    const found = profileProblems({ displayName: name });
    setProblems(found);
    if (found.length > 0) return;
    save({ displayName: name.trim(), avatar: { kind: "initials", color }, updatedAt: new Date().toISOString() });
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ProfileAvatar className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{profile.displayName}</h2>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </button>
        )}
      </div>

      {editing && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Display name</span>
            <input
              value={name}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              className={field}
            />
          </label>
          <div>
            <p id="avatar-colour" className="text-sm font-medium">
              Avatar colour
            </p>
            <div role="radiogroup" aria-labelledby="avatar-colour" className="mt-2 flex flex-wrap gap-2">
              {AVATAR_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={color === option}
                  aria-label={option}
                  onClick={() => setColor(option)}
                  style={{ backgroundColor: AVATAR_SWATCH[option] }}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-surface",
                    color === option && "ring-2 ring-foreground"
                  )}
                >
                  {color === option && <Check className="size-5 text-[#0a0a0a]" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
          {problems.length > 0 && (
            <p role="alert" className="text-sm text-danger">
              {problems[0]}
            </p>
          )}
          <div className="flex gap-3">
            <Button className="h-11 flex-1 font-bold" onClick={saveEdit}>
              Save
            </Button>
            <Button variant="outline" className="h-11 flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <dl aria-label="Lifetime" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 truncate font-mono text-lg font-bold tabular-nums text-accent">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="profile-unit" className="flex items-center justify-between gap-3">
        <h2 id="profile-unit" className="text-sm font-bold">
          Weight unit
        </h2>
        <div role="radiogroup" aria-labelledby="profile-unit" className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
          {WEIGHT_UNITS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={unit === option}
              onClick={() => setUnit(option)}
              className={cn(
                "h-11 w-16 rounded-lg text-sm font-bold",
                unit === option ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
