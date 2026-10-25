import { expect, test } from "@playwright/test";

import { listWorkoutLogs, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// Phase 2 gates 4 and 5: finishing offline keeps the workout, shows
// "Waiting to sync", and reconnecting syncs exactly one copy.

test.beforeEach(async () => {
  await resetEmulators();
});

test("a workout finished offline syncs once when the connection returns", async ({
  page,
  context,
}) => {
  await signUp(page, testEmail("offline"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "6");

  await context.setOffline(true);
  await logSet(page, "Barbell bench press", 1, "135", "6");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();

  await expect(page.getByText("Workout saved")).toBeVisible();
  await expect(page.getByText("Waiting to sync")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
  expect(await listWorkoutLogs()).toHaveLength(0);

  await context.setOffline(false);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 45_000 });
  await expect.poll(async () => (await listWorkoutLogs()).length).toBe(1);

  // A reload (which resends any unconfirmed receipt) still leaves one copy.
  await page.goto("/workouts?tab=history");
  await expect(page.getByRole("link", { name: /Push day/ })).toContainText("Saved");
  expect(await listWorkoutLogs()).toHaveLength(1);
});
