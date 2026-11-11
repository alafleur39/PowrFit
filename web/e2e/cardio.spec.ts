import { expect, test } from "@playwright/test";

import { listWorkoutLogs, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// Cardio (2026-11-02): a stair climber session is logged by time, saved as
// a version 2 workout, and its minutes show next to sets and volume.

test.beforeEach(async () => {
  await resetEmulators();
});

test("a stair climber session is logged by time and shows as cardio minutes", async ({ page }) => {
  await signUp(page, testEmail("cardio"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "8");

  await page.getByRole("button", { name: "Add exercise" }).click();
  const picker = page.getByRole("dialog", { name: "Add exercises" });
  await picker.getByPlaceholder("Search exercises").fill("stairmaster");
  await picker.getByRole("checkbox", { name: /Stair climber/ }).click();
  await picker.getByRole("button", { name: /^Add/ }).click();

  const card = page.getByRole("region", { name: "Stair climber" });
  await expect(card.getByRole("button", { name: "Set 1 not done" })).toBeDisabled();
  await card.getByLabel("Stair climber set 1 time").fill("20");
  await card.getByLabel("Stair climber set 1 level").fill("8");
  await card.getByLabel("Stair climber set 1 floors").fill("95");
  await card.getByRole("button", { name: "Set 1 not done" }).click();
  await expect(card.getByRole("button", { name: "Set 1 done" })).toBeVisible();
  await expect(page.getByText("2 sets · 1,080 lb · 20 min cardio")).toBeVisible();

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  await expect(page.locator("dl").first().getByText("20 min")).toBeVisible();
  await expect(page.getByText("20:00 · level 8 · 95 floors")).toBeVisible();

  await page.goto("/workouts?tab=history");
  const row = page.getByRole("link", { name: /Push day/ });
  await expect(row).toContainText("2 sets · 1,080 lb · 20 min cardio");
  // Saved means the server has it.
  await expect(row).toHaveAttribute("data-sync-status", "synced");

  const [log] = await listWorkoutLogs();
  const json = JSON.stringify(log.fields);
  expect(json).toContain('"schemaVersion":{"integerValue":"2"}');
  expect(json).toContain('"durationSec":{"integerValue":"1200"}');
  expect(json).toContain('"cardioSec":{"integerValue":"1200"}');
});
