import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import dotenv from "dotenv"; // load environment from .env file
dotenv.config(); // this  is important

// Firebase app configuration (replace placeholder values with your real project keys).
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: "powrfit-5038a.firebaseapp.com",
  projectId: "powrfit-5038a",
  storageBucket: "powrfit-5038a.firebasestorage.app",
  messagingSenderId: "971531189225",
  appId: "1:971531189225:web:a09bfd59f491a315886978",
  measurementId: "G-ZJEEKFFB2P"
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
  const getPersistence = (() => {
    try {
      // use require so Metro loads the helper only on native platforms
      // @ts-ignore Types for this helper are not bundled yet.
      const { getReactNativePersistence } = require("firebase/auth");
      return getReactNativePersistence;
    } catch (error) {
      if (__DEV__) {
        console.error("Failed to load Firebase native persistence helper.", error);
      }
      throw error;
    }
  })();

  auth = initializeAuth(app, {
    persistence: getPersistence(AsyncStorage),
  });
}

const db = getFirestore(app);

export { app, auth, db };
export default app;
