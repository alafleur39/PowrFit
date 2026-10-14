export type ProgressStats = {
  workoutStreak: number;
  caloriesBurned: number;
  weeklyMinutes: number;
  activeMinutes: number;
  weeklyGoal: number;
  completedSessions: number;
};

export type ProgressGoal = {
  id: string;
  title: string;
  progress: number;
  target: string;
};

export type UpcomingSession = {
  id: string;
  title: string;
  coach: string;
  time: string;
  focus: string;
};

export type Workout = {
  id: string;
  title: string;
  focus: string;
  level: "Foundation" | "Build" | "Advanced";
  duration: number;
  calories: number;
  summary: string;
  equipment: string[];
  blocks: Array<{
    name: string;
    work: string;
  }>;
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  title: string;
  duration: number;
  calories: number;
  completedAt: string;
};

export type UserProgress = {
  stats: ProgressStats;
  goals: ProgressGoal[];
  upcomingSessions: UpcomingSession[];
  recentSessions: WorkoutSession[];
  updatedAt: string;
};

export type LogWorkoutInput = {
  workoutId: string;
  title: string;
  duration: number;
  calories: number;
};

export const WORKOUTS: Workout[] = [
  {
    id: "hiit-burner",
    title: "HIIT Burner",
    focus: "Cardio",
    level: "Build",
    duration: 32,
    calories: 420,
    summary:
      "Intervals built for a hard sweat without needing much floor space.",
    equipment: ["Mat", "Timer"],
    blocks: [
      { name: "Primer", work: "4 min mobility and ramp-up" },
      { name: "Main set", work: "8 rounds: 40 sec work, 20 sec rest" },
      { name: "Finisher", work: "6 min alternating sprints and plank holds" },
    ],
  },
  {
    id: "strength-lab",
    title: "Strength Lab",
    focus: "Upper Body",
    level: "Advanced",
    duration: 45,
    calories: 360,
    summary:
      "A controlled upper-body lift with push, pull, and stability work.",
    equipment: ["Dumbbells", "Bench", "Cable stack"],
    blocks: [
      { name: "Press", work: "4 x 8 dumbbell bench press" },
      { name: "Pull", work: "4 x 10 seated cable rows" },
      { name: "Accessory", work: "3 x 12 lateral raises and face pulls" },
    ],
  },
  {
    id: "lower-power",
    title: "Lower Power",
    focus: "Lower Body",
    level: "Build",
    duration: 40,
    calories: 390,
    summary:
      "Strength and conditioning for legs, glutes, and trunk control.",
    equipment: ["Barbell", "Kettlebell"],
    blocks: [
      { name: "Squat", work: "5 x 5 back squat" },
      { name: "Hinge", work: "4 x 8 Romanian deadlift" },
      { name: "Carry", work: "6 x 30m kettlebell suitcase carry" },
    ],
  },
  {
    id: "mobility-reset",
    title: "Mobility Reset",
    focus: "Recovery",
    level: "Foundation",
    duration: 24,
    calories: 120,
    summary:
      "Low intensity mobility work for tight hips, shoulders, and back.",
    equipment: ["Mat", "Foam roller"],
    blocks: [
      { name: "Spine", work: "6 min cat-cow, thread-the-needle, rotations" },
      { name: "Hips", work: "10 min couch stretch and 90/90 switches" },
      { name: "Breath", work: "5 min downshift breathing" },
    ],
  },
];

export const DEFAULT_PROGRESS: UserProgress = {
  stats: {
    workoutStreak: 10,
    caloriesBurned: 4100,
    weeklyMinutes: 240,
    activeMinutes: 175,
    weeklyGoal: 300,
    completedSessions: 18,
  },
  goals: [
    {
      id: "goal-5k",
      title: "5K Personal Best",
      progress: 64,
      target: "Target: 24:00",
    },
    {
      id: "goal-consistency",
      title: "Consistency",
      progress: 78,
      target: "Target: 5x / week",
    },
    {
      id: "goal-strength",
      title: "Bench Press",
      progress: 52,
      target: "Target: 185 lb",
    },
  ],
  upcomingSessions: [
    {
      id: "session-hiit",
      title: "HIIT Burner",
      coach: "Coach Maya",
      time: "Today, 6:00 PM",
      focus: "Cardio",
    },
    {
      id: "session-strength",
      title: "Strength Lab",
      coach: "Coach Ben",
      time: "Thu, 7:30 AM",
      focus: "Upper Body",
    },
  ],
  recentSessions: [
    {
      id: "recent-1",
      workoutId: "lower-power",
      title: "Lower Power",
      duration: 40,
      calories: 390,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    },
    {
      id: "recent-2",
      workoutId: "mobility-reset",
      title: "Mobility Reset",
      duration: 24,
      calories: 120,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    },
  ],
  updatedAt: new Date().toISOString(),
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const percentOfGoal = (value: number, goal: number) => {
  if (goal <= 0) return 0;
  return clamp(Math.round((value / goal) * 100), 0, 100);
};

export const formatDelta = (
  current: number,
  previous?: number,
  suffix = ""
): string | undefined => {
  if (previous === undefined) return undefined;
  const diff = Math.round(current - previous);
  if (diff === 0) return undefined;
  const symbol = diff > 0 ? "+" : "-";
  return `${symbol}${Math.abs(diff)}${suffix}`;
};

export const applyWorkoutLog = (
  progress: UserProgress,
  input: LogWorkoutInput
): UserProgress => {
  const now = new Date().toISOString();
  const session: WorkoutSession = {
    id: `session-${Date.now()}`,
    completedAt: now,
    ...input,
  };

  const activeMinutes = clamp(
    progress.stats.activeMinutes + input.duration,
    0,
    Math.max(progress.stats.weeklyGoal, progress.stats.activeMinutes + input.duration)
  );

  return {
    ...progress,
    stats: {
      ...progress.stats,
      caloriesBurned: progress.stats.caloriesBurned + input.calories,
      weeklyMinutes: progress.stats.weeklyMinutes + input.duration,
      activeMinutes,
      completedSessions: progress.stats.completedSessions + 1,
      workoutStreak: progress.stats.workoutStreak + 1,
    },
    goals: progress.goals.map((goal) => ({
      ...goal,
      progress: clamp(goal.progress + (goal.id === "goal-consistency" ? 8 : 3), 0, 100),
    })),
    recentSessions: [session, ...progress.recentSessions].slice(0, 6),
    updatedAt: now,
  };
};
