import { mkdirSync, writeFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { workoutTotals, type LoggedExercise, type WorkoutLog } from "@/lib/strength";
import { encodeWorkoutLog } from "@/lib/workout/workout-codec";

import { logSet, resetEmulators, signIn, signUp, TEST_PASSWORD } from "../e2e/helpers";

// UI/UX playbook screenshot loop (docs/uiux-playbook.md). Captures every main
// screen at iPhone 13 size (390×844 @3x, WebKit) as JPEG into
// docs/screenshots/<SHOTS_PHASE>/. Runs against the emulators like the e2e
// tests: npm run screenshots (SHOTS_PHASE=phase1 npm run screenshots).

//
// Accessibility runs (Phase 6), all optional:
//   SHOTS_TYPE_SCALE=3.1  text at that iPhone text size (3.1 = the largest)
//   SHOTS_CONTRAST=more   Increase Contrast on
//   SHOTS_AXE=1           also checks each screen with axe-core and writes
//                         axe.json next to the images. axe-core comes with
//                         the lint tools; it isn't a dependency of its own.

const PHASE = process.env.SHOTS_PHASE ?? "phase0";
const DIR = `docs/screenshots/${PHASE}`;
const TYPE_SCALE = process.env.SHOTS_TYPE_SCALE;
const CONTRAST = process.env.SHOTS_CONTRAST === "more" ? "more" : null;
const AXE = process.env.SHOTS_AXE === "1";
const axeFindings: Record<string, { id: string; impact: string | null; help: string; targets: string[] }[]> = {};
const FIRESTORE = "http://127.0.0.1:8080/v1/projects/demo-powrfit/databases/(default)/documents";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

async function shot(page: Page, name: string) {
  mkdirSync(DIR, { recursive: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${name}.jpg`, type: "jpeg", quality: 80 });
  if (AXE) await audit(page, name);
}

async function audit(page: Page, name: string) {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document, options: object) => Promise<{ violations: { id: string; impact: string | null; help: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(" ")) }));
  });
  axeFindings[name] = violations;
  writeFileSync(`${DIR}/axe.json`, JSON.stringify(axeFindings, null, 2));
}

test.beforeEach(async ({ page }) => {
  if (CONTRAST) await page.emulateMedia({ contrast: CONTRAST });
  if (TYPE_SCALE) {
    // Stands in for the iPhone's text size: beats what dynamic-type.ts sets.
    await page.addInitScript((scale) => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = `:root { --type-scale: ${scale} !important; }`;
        document.head.appendChild(style);
      });
    }, TYPE_SCALE);
  }
});

/** Scrolls the page and every scrollable box to the bottom, then shoots. */
async function shotBottom(page: Page, name: string) {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
        el.scrollTop = el.scrollHeight;
      }
    }
  });
  await shot(page, name);
}

// Firestore REST wants typed values.
type Value = Record<string, unknown>;
function toValue(value: unknown): Value {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  return { mapValue: { fields: toFields(value as Record<string, unknown>) } };
}
const toFields = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).map(([key, v]) => [key, toValue(v)]));

async function createAccount(email: string): Promise<string> {
  const response = await fetch(`${AUTH}/accounts:signUp?key=fake-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD, returnSecureToken: true }),
  });
  expect(response.ok).toBe(true);
  return ((await response.json()) as { localId: string }).localId;
}

const strength = (exerciseId: string, exerciseName: string, weight: number, reps: number, sets = 3): LoggedExercise => ({
  exerciseId,
  exerciseName,
  sets: Array.from({ length: sets }, () => ({ weight, reps, unit: "lb" as const, done: true })),
});

const ROUTINES: Record<string, (week: number) => LoggedExercise[]> = {
  "Push day": (week) => [
    strength("barbell-bench-press", "Barbell bench press", [175, 180, 185, 185, 180][week] ?? 185, 5),
    strength("overhead-press", "Overhead press", 95 + week * 5, 6),
    strength("incline-dumbbell-press", "Incline dumbbell press", 50, 10),
  ],
  "Pull day": (week) => [
    strength("barbell-row", "Barbell row", 135 + week * 5, 8),
    strength("lat-pulldown", "Lat pulldown", 120, 10),
  ],
  "Leg day": (week) => [
    strength("barbell-back-squat", "Barbell back squat", 205 + week * 10, 5),
    strength("romanian-deadlift", "Romanian deadlift", 155, 8),
  ],
};

/** About five weeks of history, the latest two days ago (last week, when today is early in the week). */
async function seedHistory(uid: string) {
  const plan: [number, string][] = [
    [33, "Push day"], [31, "Pull day"], [29, "Leg day"],
    [26, "Push day"], [24, "Pull day"], [19, "Leg day"],
    [16, "Push day"], [12, "Pull day"], [9, "Push day"],
    [6, "Leg day"], [4, "Pull day"], [2, "Push day"],
  ];
  for (const [index, [days, routineName]] of plan.entries()) {
    const start = new Date(Date.now() - days * 86_400_000);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start.getTime() + 55 * 60_000).toISOString();
    const week = Math.min(4, Math.floor((33 - days) / 7));
    const exercises = ROUTINES[routineName](week);
    const log: WorkoutLog = {
      id: `seed-${index}`,
      schemaVersion: 2,
      routineId: `preset-${routineName.toLowerCase().replace(" ", "-")}`,
      routineName,
      startedAt: start.toISOString(),
      endedAt: end,
      updatedAt: end,
      exercises,
      exerciseIds: exercises.map((e) => e.exerciseId),
      totals: workoutTotals(exercises, "lb"),
    };
    const response = await fetch(`${FIRESTORE}/users/${uid}/workoutLogs/${log.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({ fields: toFields(encodeWorkoutLog(log)) }),
    });
    expect(response.ok, await response.text()).toBe(true);
  }
}

test.beforeAll(async () => {
  await resetEmulators();
});

test("signed out", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await shot(page, "login");
  await page.goto("/privacy");
  await shot(page, "privacy");
});

test("first use (new account)", async ({ page }) => {
  await signUp(page, "newlifter@powrfit.test");
  await shot(page, "home-empty");
  await shotBottom(page, "home-empty-bottom");
  await page.goto("/workouts");
  await shot(page, "workouts-routines-empty");
  await shotBottom(page, "workouts-routines-empty-bottom");
  await page.goto("/progress");
  await shot(page, "progress-empty");
  await page.goto("/gyms");
  await shot(page, "gyms-empty");
  await page.goto("/profile");
  await shot(page, "profile-empty");

  await page.goto("/home");
  await page.getByRole("button", { name: "Empty workout" }).click();
  await expect(page).toHaveURL(/\/log$/);
  await shot(page, "logger-empty");
  await page.getByRole("button", { name: "Discard workout" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Discard workout" }).click();

  // The dev-only Components screen (Phase 2), whole page, then a sheet.
  await page.goto("/dev/components");
  await expect(page.getByRole("heading", { name: "Components" })).toBeVisible();
  mkdirSync(DIR, { recursive: true });
  await page.screenshot({ path: `${DIR}/components-full.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await page.getByRole("button", { name: "Open sheet" }).click();
  await shot(page, "components-sheet");
});

test("regular lifter (5 weeks of history)", async ({ page }) => {
  const email = "alex.lifter@powrfit.test";
  await seedHistory(await createAccount(email));
  await signIn(page, email);
  await page.waitForTimeout(1500);
  await shot(page, "home-new-week");
  await shotBottom(page, "home-new-week-bottom");

  await page.goto("/workouts");
  await shot(page, "workouts-routines");
  await shotBottom(page, "workouts-routines-bottom");
  for (const tab of ["History", "Explore"]) {
    await page.getByRole("tab", { name: tab }).click();
    await shot(page, `workouts-${tab.toLowerCase()}`);
  }

  await page.goto("/progress");
  await page.waitForTimeout(800);
  await shot(page, "progress-week");
  await page.getByRole("radio", { name: "Month" }).click();
  await shot(page, "progress-month");
  await shotBottom(page, "progress-month-bottom");

  await page.goto("/profile");
  await shot(page, "profile");
  await shotBottom(page, "profile-bottom");

  // The active-workout logger, mid-workout, then the summary.
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await expect(page).toHaveURL(/\/log$/);
  await shot(page, "logger-start");
  await logSet(page, "Barbell bench press", 0, "190", "5");
  await shot(page, "logger-set-done");
  await page.getByRole("region", { name: "Barbell bench press" }).getByLabel(/^Set 2 weight/).focus();
  await shot(page, "logger-stepper");
  await page.getByRole("region", { name: "Barbell bench press" }).getByRole("button", { name: "Set 2 not done" }).click();
  await shotBottom(page, "logger-bottom");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await shot(page, "logger-finish-dialog");
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  await shot(page, "logger-summary");

  await page.goto("/home");
  await page.waitForTimeout(800);
  await shot(page, "home-populated");
  await shotBottom(page, "home-populated-bottom");
});
