"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  DEFAULT_PROGRESS,
  WORKOUTS,
  applyWorkoutLog,
  type LogWorkoutInput,
  type ProgressGoal,
  type UpcomingSession,
  type UserProgress,
  type WorkoutSession,
} from "@/lib/training-data";

const progressKey = (uid: string) => `powrfit::progress::${uid}`;
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

const readLocalProgress = (uid: string): UserProgress | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(progressKey(uid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProgress;
  } catch {
    return null;
  }
};

const writeLocalProgress = (uid: string, progress: UserProgress) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressKey(uid), JSON.stringify(progress));
};

const seedLocalProgress = (uid: string) => {
  const cached = readLocalProgress(uid);
  if (cached) return cached;
  const seeded = {
    ...DEFAULT_PROGRESS,
    updatedAt: new Date().toISOString(),
  };
  writeLocalProgress(uid, seeded);
  return seeded;
};

const loadFirestoreProgress = async (uid: string): Promise<UserProgress | null> => {
  const summaryRef = doc(db, "users", uid, "dashboard", "summary");
  const summarySnap = await getDoc(summaryRef);
  if (!summarySnap.exists()) return null;

  const [goalsSnap, upcomingSnap, recentSnap] = await Promise.all([
    getDocs(collection(db, "users", uid, "goals")),
    getDocs(collection(db, "users", uid, "upcomingSessions")),
    getDocs(
      query(
        collection(db, "users", uid, "workoutSessions"),
        orderBy("completedAt", "desc"),
        limit(6)
      )
    ),
  ]);

  return {
    ...(summarySnap.data() as Omit<
      UserProgress,
      "goals" | "upcomingSessions" | "recentSessions"
    >),
    goals: goalsSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ProgressGoal[],
    upcomingSessions: upcomingSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as UpcomingSession[],
    recentSessions: recentSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as WorkoutSession[],
  };
};

export const seedFirestoreProgress = async (uid: string) => {
  const progress = seedLocalProgress(uid);

  await setDoc(doc(db, "users", uid, "dashboard", "summary"), {
    stats: progress.stats,
    updatedAt: progress.updatedAt,
  });

  await Promise.all([
    ...progress.goals.map((goal) =>
      setDoc(doc(db, "users", uid, "goals", goal.id), {
        title: goal.title,
        progress: goal.progress,
        target: goal.target,
      })
    ),
    ...progress.upcomingSessions.map((session) =>
      setDoc(doc(db, "users", uid, "upcomingSessions", session.id), {
        title: session.title,
        coach: session.coach,
        time: session.time,
        focus: session.focus,
      })
    ),
    ...progress.recentSessions.map((session) =>
      setDoc(doc(db, "users", uid, "workoutSessions", session.id), {
        workoutId: session.workoutId,
        title: session.title,
        duration: session.duration,
        calories: session.calories,
        completedAt: session.completedAt,
      })
    ),
  ]);

  return progress;
};

export const getUserProgress = async (uid: string): Promise<UserProgress> => {
  if (useMockData) {
    return seedLocalProgress(uid);
  }

  try {
    const progress = await loadFirestoreProgress(uid);
    if (progress) {
      writeLocalProgress(uid, progress);
      return progress;
    }
    return await seedFirestoreProgress(uid);
  } catch (error) {
    console.warn("Firestore progress read failed; using local fallback.", error);
    return seedLocalProgress(uid);
  }
};

export const logWorkout = async (
  uid: string,
  input: LogWorkoutInput
): Promise<UserProgress> => {
  const current = await getUserProgress(uid);
  const next = applyWorkoutLog(current, input);
  writeLocalProgress(uid, next);

  if (!useMockData) {
    try {
      const recent = next.recentSessions[0];
      await Promise.all([
        setDoc(doc(db, "users", uid, "dashboard", "summary"), {
          stats: next.stats,
          updatedAt: next.updatedAt,
        }),
        addDoc(collection(db, "users", uid, "workoutSessions"), {
          workoutId: recent.workoutId,
          title: recent.title,
          duration: recent.duration,
          calories: recent.calories,
          completedAt: recent.completedAt,
        }),
      ]);
    } catch (error) {
      console.warn("Firestore workout write failed; local progress was saved.", error);
    }
  }

  return next;
};

export const getWorkout = (id: string) =>
  WORKOUTS.find((workout) => workout.id === id);
