"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { getUserProgress, logWorkout } from "@/lib/user-data";
import type { LogWorkoutInput, UserProgress } from "@/lib/training-data";

export function useUserProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await getUserProgress(user.uid);
      setProgress(next);
    } catch {
      setError("Unable to load your training data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!user) {
        if (!active) return;
        setProgress(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const next = await getUserProgress(user.uid);
        if (active) {
          setProgress(next);
        }
      } catch {
        if (active) {
          setError("Unable to load your training data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const logSession = useCallback(
    async (input: LogWorkoutInput) => {
      if (!user) return null;
      const next = await logWorkout(user.uid, input);
      setProgress(next);
      return next;
    },
    [user]
  );

  return { progress, loading, error, refresh, logSession };
}
