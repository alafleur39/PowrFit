"use client";

import { useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatGrid, StatTile } from "@/components/ui/stat-tile";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { useHistoryLogs, useRecords } from "@/components/workout/use-records";
import {
  AVATAR_COLORS,
  AVATAR_SWATCH,
  DISPLAY_NAME_MAX,
  defaultProfile,
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
  "min-h-11 w-full rounded-input border border-input bg-background px-3 text-body text-foreground focus-visible:border-ring focus-visible:outline-none";

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

  // Still the name made from the email (D41): nudge for a real one.
  const namedFromEmail = profile.displayName === defaultProfile(user?.email, "").displayName;

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
      <div className="flex flex-wrap items-center gap-4">
        <ProfileAvatar className="size-16 text-title3" />
        <div className="min-w-0 flex-1 basis-40">
          <h2 className="text-title3 font-bold wrap-anywhere">{profile.displayName}</h2>
          <p className="text-footnote text-muted-foreground wrap-anywhere">{user?.email}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-footnote font-semibold hover:bg-surface"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </button>
        )}
      </div>

      {editing && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-footnote font-medium">Display name</span>
            <input
              value={name}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              className={field}
            />
          </label>
          <div>
            <p id="avatar-colour" className="text-footnote font-medium">
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
                  {color === option && <Check className="size-5 text-accent-foreground" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
          {problems.length > 0 && (
            <p role="alert" className="text-footnote text-danger">
              {problems[0]}
            </p>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={saveEdit}>
              Save
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!editing && namedFromEmail && (
        <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4">
          <p className="min-w-0 text-footnote text-muted-foreground">
            <span className="block text-body font-semibold text-foreground">What should we call you?</span>
            Your name shows on your profile instead of your email.
          </p>
          <Button variant="secondary" onClick={startEditing}>
            Add name
          </Button>
        </div>
      )}

      <section aria-labelledby="profile-all-time" className="flex flex-col gap-2">
        <h2 id="profile-all-time" className="px-1 text-footnote font-semibold text-muted-foreground">
          All time
        </h2>
        <StatGrid label="Lifetime" columns={4}>
          {stats.map(([label, value]) => (
            <StatTile key={label} label={label} value={value} />
          ))}
        </StatGrid>
        <p className="px-1 text-caption text-muted-foreground">
          A PR is a set heavier than any earlier workout&apos;s best on that lift.
        </p>
      </section>

      <section
        aria-labelledby="profile-unit"
        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-2"
      >
        <h2 id="profile-unit" className="text-body font-semibold">
          Weight unit
        </h2>
        <SegmentedControl
          ariaLabel="Weight unit"
          segments={WEIGHT_UNITS.map((option) => ({ value: option, label: option }))}
          value={unit}
          onChange={setUnit}
          className="w-36"
        />
      </section>
    </div>
  );
}
