"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { subscribeRoutines, type RoutineEntry } from "@/lib/workout/routine-repo";

/** The signed-in user's routines, most recently edited first (P4-02). */
export function useRoutines() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<{
    uid: string | undefined;
    routines: RoutineEntry[];
    loading: boolean;
    error: boolean;
  }>({ uid: undefined, routines: [], loading: true, error: false });

  useEffect(() => {
    if (!uid) return;
    return subscribeRoutines(
      uid,
      (routines) => setState({ uid, routines, loading: false, error: false }),
      () => setState((current) => ({ ...current, uid, loading: false, error: true }))
    );
  }, [uid]);

  const current = state.uid === uid;
  return {
    routines: current ? state.routines : [],
    loading: !current || state.loading,
    error: current && state.error,
  };
}
