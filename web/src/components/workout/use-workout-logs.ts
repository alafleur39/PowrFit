"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { mergeHistory, type HistoryItem } from "@/lib/workout/history-merge";
import {
  subscribeRecent,
  subscribeSince,
  subscribeWorkoutLog,
  type LogEntry,
} from "@/lib/workout/workout-repo";
import { useActiveWorkout } from "./active-workout-provider";

type Subscribe = (
  uid: string,
  onChange: (entries: LogEntry[]) => void,
  onError: (error: Error) => void
) => () => void;

/** Subscribes to a query and merges in this device's receipts. */
function useMergedLogs(subscribe: Subscribe, key: string) {
  const { user } = useAuth();
  const { receipts } = useActiveWorkout();
  const uid = user?.uid;
  const [state, setState] = useState<{
    key: string;
    entries: LogEntry[];
    loading: boolean;
    error: boolean;
  }>({ key: "", entries: [], loading: true, error: false });

  useEffect(() => {
    if (!uid) return;
    const stateKey = `${uid}:${key}`;
    return subscribe(
      uid,
      (entries) => setState({ key: stateKey, entries, loading: false, error: false }),
      () => setState((current) => ({ ...current, key: stateKey, loading: false, error: true }))
    );
    // `subscribe` is rebuilt each render; `key` captures what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key]);

  const current = state.key === `${uid}:${key}`;
  const items = useMemo<HistoryItem[]>(
    () => mergeHistory(current ? state.entries : [], receipts),
    [current, state.entries, receipts]
  );
  return { items, loading: !current || state.loading, error: current && state.error };
}

/** The newest `count` workouts plus any unconfirmed receipts. */
export function useRecentWorkouts(count: number) {
  return useMergedLogs(
    (uid, onChange, onError) => subscribeRecent(uid, count, onChange, onError),
    `recent:${count}`
  );
}

/** Workouts that ended at or after `isoDate`, plus unconfirmed receipts. */
export function useWorkoutsSince(isoDate: string) {
  const result = useMergedLogs(
    (uid, onChange, onError) => subscribeSince(uid, isoDate, onChange, onError),
    `since:${isoDate}`
  );
  const items = useMemo(
    () => result.items.filter((item) => !("log" in item) || item.log.endedAt >= isoDate),
    [result.items, isoDate]
  );
  return { ...result, items };
}

/** One workout, from the server cache or this device's receipts. */
export function useWorkout(id: string) {
  const result = useMergedLogs(
    (uid, onChange, onError) =>
      subscribeWorkoutLog(uid, id, (entry) => onChange(entry ? [entry] : []), onError),
    `one:${id}`
  );
  const item = useMemo(() => result.items.find((candidate) => candidate.id === id), [result.items, id]);
  return { item, loading: result.loading, error: result.error };
}
