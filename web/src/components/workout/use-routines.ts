"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { subscribeRoutines, type RoutineEntry } from "@/lib/workout/routine-repo";

type State = {
  uid: string | undefined;
  routines: RoutineEntry[];
  loading: boolean;
  error: boolean;
};

/**
 * The last routines seen this session, per user (P6-09, D39). A screen that
 * opens again starts from them instead of "Loading", and the subscription
 * replaces them as soon as it answers.
 */
const lastSeen = new Map<string, RoutineEntry[]>();

/** The signed-in user's routines, most recently edited first (P4-02). */
export function useRoutines() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<State>(() => {
    const seen = uid ? lastSeen.get(uid) : undefined;
    return seen
      ? { uid, routines: seen, loading: false, error: false }
      : { uid: undefined, routines: [], loading: true, error: false };
  });

  useEffect(() => {
    if (!uid) return;
    return subscribeRoutines(
      uid,
      (routines) => {
        lastSeen.set(uid, routines);
        setState({ uid, routines, loading: false, error: false });
      },
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
