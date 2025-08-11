import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth /* getReactNativePersistence will be typed below */ } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const app = getApps().length ? getApp() : initializeApp({
  apiKey: "...", authDomain: "...", projectId: "...",
  storageBucket: "...", messagingSenderId: "...", appId: "..."
});

let auth = getAuth(app);
if (Platform.OS !== "web") {
  // @ts-expect-error getReactNativePersistence is available in the RN bundle
  const { getReactNativePersistence } = await import("firebase/auth");
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {}
}
export const db = getFirestore(app);
export { app, auth };
