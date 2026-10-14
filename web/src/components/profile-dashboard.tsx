"use client";

import Link from "next/link";
import Image from "next/image";
import type { ElementType } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Flame,
  Loader2,
  RefreshCw,
  Target,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { useUserProgress } from "@/hooks/use-user-progress";
import {
  DEFAULT_PROGRESS,
  formatDelta,
  percentOfGoal,
  type ProgressStats,
} from "@/lib/training-data";

const quickActions = [
  { label: "Start Workout", href: "/workouts", icon: Zap },
  { label: "Progress", href: "/profile#goals", icon: Activity },
  { label: "Schedule", href: "/home", icon: CalendarDays },
  { label: "Nutrition", href: "/profile#nutrition", icon: Utensils },
];

export function ProfileDashboard() {
  const { user } = useAuth();
  const { progress, loading, error, refresh } = useUserProgress();
  const resolved = progress ?? DEFAULT_PROGRESS;
  const previousStats: ProgressStats | undefined = progress
    ? {
        ...progress.stats,
        workoutStreak: Math.max(0, progress.stats.workoutStreak - 1),
        caloriesBurned: Math.max(0, progress.stats.caloriesBurned - 240),
        weeklyMinutes: Math.max(0, progress.stats.weeklyMinutes - 18),
        activeMinutes: Math.max(0, progress.stats.activeMinutes - 18),
      }
    : undefined;

  const weeklyPercent = percentOfGoal(
    resolved.stats.activeMinutes,
    resolved.stats.weeklyGoal
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="overflow-hidden rounded-2xl border-0 bg-[#080c12] py-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <div className="grid min-h-72 lg:grid-cols-[1fr_0.7fr]">
            <div className="flex flex-col justify-between gap-8 p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium">
                    Level 7 / Challenger
                  </span>
                  <span className="rounded-md bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                    Top 10% weekly
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                    {user?.displayName ?? "PowrFit Athlete"}
                  </h1>
                  <p className="mt-2 text-sm text-white/70">{user?.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm text-white/70">This week</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {resolved.stats.activeMinutes}/{resolved.stats.weeklyGoal} min
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm text-white/70">Current streak</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {resolved.stats.workoutStreak} days
                  </p>
                </div>
              </div>
            </div>
            <div className="relative min-h-64">
              <Image
                src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop"
                alt="Athlete holding dumbbells in a gym"
                fill
                sizes="(min-width: 1280px) 35vw, 100vw"
                className="object-cover opacity-80"
              />
            </div>
          </div>
        </Card>

        <Card className="glass-card rounded-2xl border">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Weekly goal</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {weeklyPercent}% complete
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={refresh}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              <span className="sr-only">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div
              className="relative mx-auto flex aspect-square max-w-56 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(hsl(72 100% 56%) ${weeklyPercent}%, rgba(255,255,255,0.1) 0)`,
              }}
            >
              <div className="flex size-[78%] flex-col items-center justify-center rounded-full bg-background text-center">
                <span className="text-4xl font-semibold">{weeklyPercent}%</span>
                <span className="text-muted-foreground mt-1 text-xs">
                  active minutes
                </span>
              </div>
            </div>
            {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Flame}
          label="Workout Streak"
          value={`${resolved.stats.workoutStreak} days`}
          delta={formatDelta(
            resolved.stats.workoutStreak,
            previousStats?.workoutStreak,
            " days"
          )}
        />
        <StatCard
          icon={Zap}
          label="Calories Burned"
          value={resolved.stats.caloriesBurned.toLocaleString()}
          delta={
            formatDelta(
              resolved.stats.caloriesBurned,
              previousStats?.caloriesBurned
            ) ?? undefined
          }
        />
        <StatCard
          icon={Activity}
          label="Weekly Minutes"
          value={`${resolved.stats.weeklyMinutes} min`}
          delta={formatDelta(
            resolved.stats.weeklyMinutes,
            previousStats?.weeklyMinutes,
            " min"
          )}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="glass-card rounded-2xl border">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.08]"
              >
                <action.icon className="size-5 text-primary" />
                <span className="mt-3 block text-sm font-medium">
                  {action.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card id="goals" className="glass-card rounded-2xl border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Active goals</CardTitle>
            <Target className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent className="space-y-4">
            {resolved.goals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-muted-foreground text-sm">{goal.target}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {Math.round(goal.progress)}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card rounded-2xl border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming sessions</CardTitle>
            <CalendarDays className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.upcomingSessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {session.coach} / {session.time}
                    </p>
                  </div>
                  <span className="rounded-md bg-primary/[0.15] px-2 py-1 text-xs font-semibold text-primary">
                    {session.focus}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Trophy className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/workouts/${session.workoutId}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/30 hover:bg-primary/[0.08]"
              >
                <span>
                  <span className="block font-medium">{session.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {session.duration} min / {session.calories} kcal
                  </span>
                </span>
                <ArrowUpRight className="text-muted-foreground size-4" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="nutrition" className="glass-card rounded-2xl border p-5">
        <p className="text-sm font-medium">Nutrition</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Nutrition is reserved for the next product pass. The quick action is
          wired here so the flow has a stable destination.
        </p>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: ElementType;
  label: string;
  value: string;
  delta?: string;
}) {
  const negative = delta?.startsWith("-");

  return (
    <Card className="glass-card rounded-2xl border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/[0.15] text-primary">
            <Icon className="size-5" />
          </span>
          {delta && (
            <span
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                negative
                  ? "bg-red-400/10 text-red-200"
                  : "bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {delta}
            </span>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  );
}
