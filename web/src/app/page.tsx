import { Dumbbell, Flame, TrendingUp, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Workout Streak", value: "10 days", icon: Flame },
  { label: "Calories Burned", value: "4,100", icon: Zap },
  { label: "Weekly Minutes", value: "240 min", icon: TrendingUp },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10 sm:max-w-2xl">
      {/* Brand / hero */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl shadow-sm">
          <Dumbbell className="size-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PowrFit</h1>
        <p className="text-muted-foreground text-sm">
          The gym in your pocket — now in the browser. Phase 0 scaffold is live.
        </p>
      </header>

      {/* Stat cards — proves theme tokens + components render */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <stat.icon className="text-muted-foreground size-5" />
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* CTA card */}
      <Card className="bg-primary text-primary-foreground border-0">
        <CardHeader>
          <CardTitle className="text-lg">You&rsquo;re crushing it</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Next.js + Tailwind v4 + shadcn/ui + Firebase-ready foundation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="secondary">Start Workout</Button>
          <Button
            variant="outline"
            className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            View Progress
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
