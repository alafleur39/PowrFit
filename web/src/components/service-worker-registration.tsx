"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

import { startInstallListener } from "./install-prompt";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Catch the install prompt early, before Home is on screen (P4-07).
    startInstallListener();
    // The iOS app bundles every file already (P7-02), so it needs no offline cache.
    if (
      process.env.NODE_ENV !== "production" ||
      Capacitor.isNativePlatform() ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => {
        console.warn("PowrFit service worker registration failed.", error);
      });
  }, []);

  return null;
}
