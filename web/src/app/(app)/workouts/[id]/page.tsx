"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProgress } from "@/hooks/use-user-progress";
import { getWorkout } from "@/lib/user-data";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workout = getWorkout(params.id);
  const { logSession } = useUserProgress();
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  if (!workout) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link href="/workouts">
            <ArrowLeft className="size-4" />
            Workouts
          </Link>
        </Button>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Workout not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              This workout is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogWorkout = async () => {
    setLogging(true);
    await logSession({
      workoutId: workout.id,
      title: workout.title,
      duration: workout.duration,
      calories: workout.calories,
    });
    setLogging(false);
    setLogged(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href="/workouts">
          <ArrowLeft className="size-4" />
          Workouts
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080c12] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(217,255,45,0.2),transparent_24rem),linear-gradient(110deg,rgba(8,12,18,0.98)_0%,rgba(8,12,18,0.82)_58%,rgba(8,12,18,0.25)_100%)]" />
        <div className="grid lg:grid-cols-[1fr_0.85fr]">
          <div className="relative z-10 flex flex-col justify-between gap-8 p-6 sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                {workout.focus}
              </p>
              <h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-normal text-white sm:text-5xl">
                {workout.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/[0.68] sm:text-base">
                {workout.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white">
                <Clock className="size-4" />
                {workout.duration} min
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white">
                <Flame className="size-4" />
                {workout.calories} kcal
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white">
                <Dumbbell className="size-4" />
                {workout.level}
              </span>
            </div>
          </div>
          <div className="relative min-h-72">
            <Image
              src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1200&auto=format&fit=crop"
              alt="Gym equipment ready for a workout"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover opacity-80"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <Card className="glass-card rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-white">Training blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workout.blocks.map((block, index) => (
              <div
                key={block.name}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{block.name}</p>
                    <p className="text-muted-foreground text-sm">{block.work}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-white">Log session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-muted-foreground text-sm">Equipment</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {workout.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {logged ? (
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-emerald-200">
                <CheckCircle2 className="size-5" />
                <p className="mt-2 text-sm font-medium">
                  Session logged. Your profile stats were updated.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleLogWorkout}
                disabled={logging}
                className="w-full bg-primary font-black uppercase text-primary-foreground hover:bg-primary/90"
              >
                {logging && <Loader2 className="size-4 animate-spin" />}
                Log completed workout
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
              onClick={() => router.push("/profile")}
            >
              View progress
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
