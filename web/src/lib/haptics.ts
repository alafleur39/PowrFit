import { Capacitor, registerPlugin } from "@capacitor/core";

// Haptics (UI playbook Phase 5): light for selection, success for a
// completed set or a new PR, warning for destructive actions.
//
// The native side is @capacitor/haptics (P7-04), registered by name so the
// website bundle carries none of its code. If the plugin is missing,
// isPluginAvailable is false and every call does nothing. Websites never
// vibrate through here.
export type HapticKind = "selection" | "success" | "warning";

type HapticsPlugin = {
  impact(options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }): Promise<void>;
  notification(options: { type: "SUCCESS" | "WARNING" | "ERROR" }): Promise<void>;
};

const Haptics = registerPlugin<HapticsPlugin>("Haptics");

export function haptic(kind: HapticKind) {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Haptics")) return;
  const done =
    kind === "selection"
      ? Haptics.impact({ style: "LIGHT" })
      : Haptics.notification({ type: kind === "success" ? "SUCCESS" : "WARNING" });
  // Feedback is a nicety: a failure here must never break the action.
  done.catch(() => {});
}
