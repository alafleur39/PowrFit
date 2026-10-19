import { expect, test } from "@playwright/test";

import { logSet, openAccountMenu, resetEmulators, signIn, signUp, testEmail } from "./helpers";

// Phase 2 gate 7 (client side): on a shared device, one user never sees
// another's workouts or draft. Server-side isolation is in tests/rules.

test.beforeEach(async () => {
  await resetEmulators();
});

test("a second user on the same device sees none of the first user's data", async ({
  page,
  isMobile,
}) => {
  const alice = testEmail("alice");
  await signUp(page, alice);

  // Alice finishes one workout and leaves another in progress.
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.goto("/home");
  // Wait for history to load: Home suggests the preset after the last one.
  await expect(page.getByText("Up next")).toBeVisible();
  await page.getByRole("button", { name: "Start Pull day" }).click();
  await logSet(page, "Barbell row", 0, "95", "8");

  // Signing out with a workout in progress warns first; keep it on the device.
  await page.goto("/home");
  await openAccountMenu(page, isMobile);
  await page.getByRole("button", { name: "Sign out" }).click();
  const warning = page.getByRole("dialog", { name: "Workout not synced yet" });
  await expect(warning).toBeVisible();
  await warning.getByRole("button", { name: "Keep on this device and sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Bob sees a clean account.
  await signUp(page, testEmail("bob"));
  await expect(page.getByText("Start your first workout")).toBeVisible();
  await expect(page.getByText("Tap to keep logging")).toHaveCount(0);
  await page.goto("/workouts?tab=history");
  await expect(page.getByText("No workouts yet")).toBeVisible();

  // Bob has nothing unsynced, so signing out is immediate.
  await page.goto("/home");
  await openAccountMenu(page, isMobile);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Alice gets her workout in progress and her history back.
  await signIn(page, alice);
  await expect(page.getByText("Tap to keep logging")).toBeVisible();
  await page.goto("/workouts?tab=history");
  await expect(page.getByRole("link", { name: /Push day/ })).toBeVisible();
});
