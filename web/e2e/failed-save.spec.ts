import { expect, test } from "@playwright/test";

import {
  listWorkoutLogs,
  logSet,
  resetEmulators,
  restoreFirestoreRules,
  setFirestoreRules,
  signUp,
  testEmail,
} from "./helpers";

// Phase 2 gate 6: a save the server refuses stays visible and recoverable,
// and is never shown as synced.

const DENY_WORKOUT_WRITES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/settings/preferences {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

test.beforeEach(async () => {
  await resetEmulators();
  await restoreFirestoreRules();
});

test.afterEach(async () => {
  await restoreFirestoreRules();
});

test("a refused save shows Sync failed with recovery, and Retry fixes it", async ({ page }) => {
  await signUp(page, testEmail("failed"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");

  await setFirestoreRules(DENY_WORKOUT_WRITES);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();

  await expect(page.getByText("Sync failed")).toBeVisible();
  await expect(page.getByText(/didn't accept this workout \(permission-denied\)/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy as text" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discard", exact: true })).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
  expect(await listWorkoutLogs()).toHaveLength(0);

  // It stays visible after a reload, at the top of History.
  await page.goto("/workouts?tab=history");
  await expect(page.getByRole("listitem").first()).toContainText("Sync failed");

  // Once the server accepts it again, Retry saves the same workout once.
  await restoreFirestoreRules();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Sync failed")).toHaveCount(0);
  await expect.poll(async () => (await listWorkoutLogs()).length).toBe(1);
});

test("a refused save can be discarded after confirming", async ({ page }) => {
  await signUp(page, testEmail("discard-failed"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await setFirestoreRules(DENY_WORKOUT_WRITES);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Sync failed")).toBeVisible();

  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("dialog", { name: "Discard this workout?" })
    .getByRole("button", { name: "Discard workout" })
    .click();
  await page.goto("/workouts?tab=history");
  await expect(page.getByText("No workouts yet")).toBeVisible();
});
