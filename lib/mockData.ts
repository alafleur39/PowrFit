// Mock backend utilities for PowrFit profile analytics.
// Drop-in replacement for a future API client – it exposes the same shape a backend call would return.

export type ProgressStats = {
  workoutStreak: number;
  caloriesBurned: number;
  weeklyMinutes: number;
  activeMinutes: number;
  weeklyGoal: number;
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

export type MockUserProgress = {
  stats: ProgressStats;
  goals: ProgressGoal[];
  upcomingSessions: UpcomingSession[];
  updatedAt: string;
};

const BASE_PROGRESS: MockUserProgress = {
  stats: {
    workoutStreak: 10,
    caloriesBurned: 4100,
    weeklyMinutes: 240,
    activeMinutes: 175,
    weeklyGoal: 300,
  },
  goals: [
    { id: "goal-5k", title: "5K Personal Best", progress: 64, target: "Target: 24:00" },
    { id: "goal-consistency", title: "Consistency", progress: 78, target: "Target: 5x / week" },
  ],
  upcomingSessions: [
    {
      id: "session-hiit",
      title: "HIIT Burner",
      coach: "Coach Maya",
      time: "Today · 6:00 PM",
      focus: "Cardio",
    },
    {
      id: "session-strength",
      title: "Strength Lab",
      coach: "Coach Ben",
      time: "Thu · 7:30 AM",
      focus: "Upper Body",
    },
  ],
  updatedAt: new Date().toISOString(),
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const addJitter = (value: number, minDelta: number, maxDelta: number) => {
  const delta = Math.random() * (maxDelta - minDelta) + minDelta;
  return value + delta;
};

const simulateStats = (previous: ProgressStats): ProgressStats => {
  const weeklyMinutes = addJitter(previous.weeklyMinutes, 5, 20);
  const activeMinutes = clamp(addJitter(previous.activeMinutes, 4, 15), 0, previous.weeklyGoal);
  return {
    workoutStreak: Math.round(addJitter(previous.workoutStreak, 0, 0.6)),
    caloriesBurned: Math.round(addJitter(previous.caloriesBurned, 120, 320)),
    weeklyMinutes: Math.round(weeklyMinutes),
    activeMinutes: Math.round(activeMinutes),
    weeklyGoal: previous.weeklyGoal,
  };
};

const simulateGoals = (previousGoals: ProgressGoal[]): ProgressGoal[] =>
  previousGoals.map((goal) => ({
    ...goal,
    progress: clamp(goal.progress + Math.random() * 6, 0, 100),
  }));

export const MOCK_PROGRESS_DEFAULT: MockUserProgress = { ...BASE_PROGRESS };

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch mock analytics – mimics a network request with latency and evolving data.
 * Replace this with a real backend call (e.g., Firebase/Firestore) when available.
 */
export async function fetchMockUserProgress(
  previous?: MockUserProgress
): Promise<MockUserProgress> {
  await delay(500);
  const base = previous ?? BASE_PROGRESS;
  return {
    stats: simulateStats(base.stats),
    goals: simulateGoals(base.goals),
    upcomingSessions: base.upcomingSessions,
    updatedAt: new Date().toISOString(),
  };
}
