import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P5-03: the Explore tab (D28). Search and filter the catalog, open an
// exercise, and see your own numbers once you've logged it.

test.beforeEach(async () => {
  await resetEmulators();
});

async function openBench(page: Page) {
  await page.goto("/workouts?tab=explore");
  await page.getByRole("button", { name: "Chest", exact: true }).click();
  await page.getByLabel("Equipment").selectOption("barbell");
  await page.getByPlaceholder("Search exercises").fill("bench");
  const list = page.getByRole("list", { name: "Exercises" });
  await expect(list.getByRole("button")).not.toHaveCount(0);
  await list.getByRole("button", { name: /^Barbell bench press/ }).click();
  await expect(page.getByRole("heading", { name: "Barbell bench press" })).toBeVisible();
}

test("browse the catalog and see your numbers for an exercise", async ({ page }) => {
  await signUp(page, testEmail("explore"));
  await page.goto("/workouts");
  await page.getByRole("tab", { name: "Explore" }).click();
  // The panel becomes usable once the swipe settles.
  await expect(page.getByRole("tab", { name: "Explore" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/^\d+ exercises$/)).toBeVisible();
  await expectNoSidewaysScroll(page, "Explore");
  await expectLabelledControls(page, "Explore");

  await page.getByPlaceholder("Search exercises").fill("zzz");
  await expect(page.getByText("No exercises match.")).toBeVisible();

  await openBench(page);
  await expect(page.getByText("Barbell", { exact: true })).toBeVisible();
  await expect(page.getByText(/haven't logged Barbell bench press yet/)).toBeVisible();
  await expectNoSidewaysScroll(page, "Exercise detail");
  await expectLabelledControls(page, "Exercise detail");
  await page.getByRole("button", { name: "All exercises" }).click();
  await expect(page.getByRole("list", { name: "Exercises" })).toBeVisible();

  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();

  await openBench(page);
  const numbers = page.getByRole("region", { name: "Your numbers" });
  await expect(numbers.getByRole("definition").filter({ hasText: "135 lb" })).toBeVisible();
  await expect(numbers.getByRole("img", { name: /^Top set weight for Barbell bench press over 1 workout\./ })).toBeVisible();
  await expectNoSidewaysScroll(page, "Exercise detail with numbers");
});
