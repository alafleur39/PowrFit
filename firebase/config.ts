import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase app configuration (replace placeholder values with your real project keys).
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use React Native persistence so Firebase keeps users signed in between app launches.
// If Metro shows "unknown module 1612", reinstall AsyncStorage with:
//   npx expo install @react-native-async-storage/async-storage
// and clear the cache: npx expo start -c
let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);

export { app, auth, db };
export default app;
