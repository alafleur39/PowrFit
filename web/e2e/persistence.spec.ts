import { expect, test } from "@playwright/test";

import { logSet, resetEmulators, signUp, testEmail } from "./helpers";

// Phase 2 gate 4 (reload): the draft survives reloads and navigation.

test.beforeEach(async () => {
  await resetEmulators();
});

test("a workout in progress survives a reload and moving between tabs", async ({ page }) => {
  await signUp(page, testEmail("persist"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "8");
  const card = page.getByRole("region", { name: "Barbell bench press" });
  await card.getByLabel(/^Set 2 weight/).fill("140");

  await page.reload();
  await expect(card.getByLabel(/^Set 1 weight/)).toHaveValue("135");
  await expect(card.getByLabel("Set 1 reps")).toHaveValue("8");
  await expect(card.getByRole("button", { name: "Set 1 done" })).toBeVisible();
  await expect(card.getByLabel(/^Set 2 weight/)).toHaveValue("140");

  // Leaving the logger keeps the workout: Home offers to resume it.
  await page.goto("/home");
  await expect(page.getByText("Tap to keep logging")).toBeVisible();
  await expect(page.getByRole("link", { name: /Push day in progress/ })).toBeVisible();
  await page.getByRole("link", { name: /Push day in progress/ }).click();
  await expect(page).toHaveURL(/\/log$/);
  await expect(card.getByRole("button", { name: "Set 1 done" })).toBeVisible();
});

test("discarding a workout asks first and then clears it", async ({ page }) => {
  await signUp(page, testEmail("discard"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await page.getByRole("button", { name: "Discard workout" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Discard workout" }).click();
  await expect(page.getByRole("heading", { name: "Start a workout" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Start a workout" })).toBeVisible();
});
