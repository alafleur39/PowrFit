import { initializeApp, getApps, getApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import { connectAuthEmulator, getAuth, indexedDBLocalPersistence, initializeAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const requiredEnv = (key: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }
  return value;
};

// Web port of the Expo app's firebase/config.ts. Browser persistence
// (localStorage) is the default on web, so no persistence wiring is needed.
const firebaseConfig = {
  apiKey: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ),
  authDomain: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  ),
  projectId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ),
  storageBucket: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  ),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// In the iOS app (P7-02) getAuth's popup and redirect helper tries to load
// Google's sign-in iframe, which a capacitor:// page can't, and sign-in never
// settles. PowrFit only uses email and password, so the app skips that helper
// and keeps the session in IndexedDB.
function createAuth(): Auth {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return getAuth(app);
  try {
    return initializeAuth(app, { persistence: indexedDBLocalPersistence });
  } catch {
    // Already initialised (for example after a hot reload).
    return getAuth(app);
  }
}

export const auth = createAuth();
// Firestore keeps a persistent cache in IndexedDB in the browser, so writes
// made offline are queued on the device, survive reloads and sync when the
// connection returns (Phase 2 plan, section B). If IndexedDB can't be opened
// (some private-browsing modes) the SDK falls back to its memory cache. The
// server render has no IndexedDB, so it uses the memory cache.
function createFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache:
        typeof window === "undefined"
          ? memoryLocalCache()
          : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialised (for example after a hot reload).
    return getFirestore(app);
  }
}

export const db = createFirestore();

// Local development and browser tests only: talk to the Firebase emulators
// (npm run emulators) instead of the real project. Off unless explicitly set.
if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !(globalThis as { __powrfitEmulators?: boolean }).__powrfitEmulators
) {
  (globalThis as { __powrfitEmulators?: boolean }).__powrfitEmulators = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
export default app;
