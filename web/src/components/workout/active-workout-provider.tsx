"use client";

// Owns the one in-progress workout and the receipts of finished workouts the
// server hasn't confirmed yet (P2-07, P2-10, P2-14). Both are written to
// localStorage on every change, so a reload, a killed app or lost signal
// never loses work. Lives in the (app) layout, so it survives navigation.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuth } from "@/components/auth-provider";
import {
  createDraft,
  finishDraft,
  setDraftUnit,
  type Routine,
  type WeightUnit,
  type WorkoutDraft,
} from "@/lib/strength";
import {
  draftKey,
  loadDraft,
  loadReceipts,
  receiptsKey,
  saveDraft,
  saveReceipts,
} from "@/lib/workout/draft-storage";
import {
  DEFAULT_WEIGHT_UNIT,
  saveWeightUnit,
  subscribeWeightUnit,
} from "@/lib/workout/preferences";
import {
  addPending,
  discardReceipt as discardReceiptIn,
  markConfirmed,
  markFailed,
  hasUnsyncedWork,
  markRetrying,
  type Receipt,
} from "@/lib/workout/receipts";
import { classifyError, errorCode } from "@/lib/workout/sync-status";
import { saveWorkoutLog } from "@/lib/workout/workout-repo";

type DraftChange = (draft: WorkoutDraft, now: string) => WorkoutDraft;

type ActiveWorkoutContextValue = {
  /** False until this user's saved draft and receipts have been read. */
  ready: boolean;
  draft: WorkoutDraft | null;
  receipts: Receipt[];
  unit: WeightUnit;
  /** Set when a stored workout couldn't be read (it was kept aside). */
  restoreProblem: boolean;
  /** Set when the device refused to save the draft (storage full or blocked). */
  storageProblem: boolean;
  start: (routine?: Routine) => WorkoutDraft;
  update: (change: DraftChange) => void;
  discard: () => void;
  /** Finishes the draft and returns the new workout's id. */
  finish: () => string;
  retryReceipt: (id: string) => void;
  discardReceipt: (id: string) => void;
  setUnit: (unit: WeightUnit) => void;
  /** True while a draft or an unconfirmed save exists on this device. */
  hasUnsyncedWork: boolean;
  /** Deletes this user's draft and receipts from the device (sign-out). */
  clearDevice: () => void;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

const nowIso = () => new Date().toISOString();

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function ActiveWorkoutProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [unit, setUnitState] = useState<WeightUnit>(DEFAULT_WEIGHT_UNIT);
  const [restoreProblem, setRestoreProblem] = useState(false);
  const [storageProblem, setStorageProblem] = useState(false);

  // Latest values, for callbacks that run after awaits or in quick succession.
  const draftRef = useRef<WorkoutDraft | null>(null);
  const receiptsRef = useRef<Receipt[]>([]);
  const inFlight = useRef(new Set<string>());

  const persistReceipts = useCallback(
    (next: Receipt[]) => {
      receiptsRef.current = next;
      setReceipts(next);
      const storage = browserStorage();
      if (uid && storage && !saveReceipts(storage, uid, next)) setStorageProblem(true);
    },
    [uid]
  );

  const persistDraft = useCallback(
    (next: WorkoutDraft | null) => {
      draftRef.current = next;
      setDraft(next);
      const storage = browserStorage();
      if (uid && storage) setStorageProblem(!saveDraft(storage, uid, next));
    },
    [uid]
  );

  /** Sends a receipt's workout. Safe to repeat: the id never changes. */
  const send = useCallback(
    (receipt: Receipt) => {
      if (!uid || inFlight.current.has(receipt.log.id)) return;
      const id = receipt.log.id;
      inFlight.current.add(id);
      saveWorkoutLog(uid, receipt.log)
        .then(() => persistReceipts(markConfirmed(receiptsRef.current, id)))
        .catch((error: unknown) => {
          const code = errorCode(error) ?? "unknown";
          // Retryable errors stay pending; the next load or Retry resends.
          if (classifyError(code) === "fatal") {
            persistReceipts(markFailed(receiptsRef.current, id, code));
          }
        })
        .finally(() => inFlight.current.delete(id));
    },
    [uid, persistReceipts]
  );

  // Load this user's draft and receipts; reset when the user changes.
  useEffect(() => {
    const storage = browserStorage();
    if (!uid || !storage) {
      /* eslint-disable react-hooks/set-state-in-effect -- reset when signed out */
      setDraft(null);
      setReceipts([]);
      draftRef.current = null;
      receiptsRef.current = [];
      setLoadedUid(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    const loadedDraft = loadDraft(storage, uid);
    const loadedReceipts = loadReceipts(storage, uid);
    draftRef.current = loadedDraft.value;
    receiptsRef.current = loadedReceipts.value;
    setDraft(loadedDraft.value);
    setReceipts(loadedReceipts.value);
    setRestoreProblem(loadedDraft.corrupted || loadedReceipts.corrupted);
    setStorageProblem(false);
    setLoadedUid(uid);

    // Resend anything finished but not yet confirmed (for example after a
    // reload while offline). Failed receipts wait for the user.
    for (const receipt of loadedReceipts.value) {
      if (receipt.status === "pending") send(receipt);
    }

    // Keep other tabs in step.
    const onStorage = (event: StorageEvent) => {
      if (event.key === draftKey(uid)) {
        const next = loadDraft(storage, uid).value;
        draftRef.current = next;
        setDraft(next);
      }
      if (event.key === receiptsKey(uid)) {
        const next = loadReceipts(storage, uid).value;
        receiptsRef.current = next;
        setReceipts(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [uid, send]);

  useEffect(() => {
    if (!uid) return;
    return subscribeWeightUnit(uid, setUnitState);
  }, [uid]);

  const start = useCallback(
    (routine?: Routine) => {
      const next = createDraft({ id: crypto.randomUUID(), now: nowIso(), unit, routine });
      persistDraft(next);
      return next;
    },
    [unit, persistDraft]
  );

  const update = useCallback(
    (change: DraftChange) => {
      const current = draftRef.current;
      if (current) persistDraft(change(current, nowIso()));
    },
    [persistDraft]
  );

  const discard = useCallback(() => persistDraft(null), [persistDraft]);

  const finish = useCallback(() => {
    const current = draftRef.current;
    if (!current) throw new Error("No workout in progress");
    const log = finishDraft(current, nowIso());
    // Receipt first, then clear the draft: the workout is never only in memory.
    const next = addPending(receiptsRef.current, log);
    persistReceipts(next);
    persistDraft(null);
    send({ status: "pending", log });
    return log.id;
  }, [persistReceipts, persistDraft, send]);

  const retryReceipt = useCallback(
    (id: string) => {
      const next = markRetrying(receiptsRef.current, id);
      persistReceipts(next);
      const receipt = next.find((item) => item.log.id === id);
      if (receipt) send(receipt);
    },
    [persistReceipts, send]
  );

  const discardReceipt = useCallback(
    (id: string) => persistReceipts(discardReceiptIn(receiptsRef.current, id)),
    [persistReceipts]
  );

  const setUnit = useCallback(
    (next: WeightUnit) => {
      setUnitState(next);
      if (uid) void saveWeightUnit(uid, next).catch(() => undefined);
      // New sets in the current workout use the new unit too.
      update((current, now) => setDraftUnit(current, next, now));
    },
    [uid, update]
  );

  const clearDevice = useCallback(() => {
    persistDraft(null);
    persistReceipts([]);
  }, [persistDraft, persistReceipts]);

  const value = useMemo<ActiveWorkoutContextValue>(
    () => ({
      ready: uid !== null && loadedUid === uid,
      draft,
      receipts,
      unit,
      restoreProblem,
      storageProblem,
      start,
      update,
      discard,
      finish,
      retryReceipt,
      discardReceipt,
      setUnit,
      hasUnsyncedWork: hasUnsyncedWork(draft !== null, receipts),
      clearDevice,
    }),
    [
      uid,
      loadedUid,
      draft,
      receipts,
      unit,
      restoreProblem,
      storageProblem,
      start,
      update,
      discard,
      finish,
      retryReceipt,
      discardReceipt,
      setUnit,
      clearDevice,
    ]
  );

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>;
}

export function useActiveWorkout(): ActiveWorkoutContextValue {
  const value = useContext(ActiveWorkoutContext);
  if (!value) throw new Error("useActiveWorkout must be used within ActiveWorkoutProvider");
  return value;
}
