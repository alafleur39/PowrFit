"use client";

import { useEffect } from "react";

import { startInstallListener } from "./install-prompt";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Catch the install prompt early, before Home is on screen (P4-07).
    startInstallListener();
    if (
      process.env.NODE_ENV !== "production" ||
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
