import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-06: Progress charts (D25). Volume bars per range and an exercise trend.

test.beforeEach(async () => {
  await resetEmulators();
});

async function finishWorkout(page: Page) {
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
}

async function startPushDay(page: Page) {
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await expect(page).toHaveURL(/\/log$/);
}

test("Progress charts volume per range and an exercise's top set", async ({ page }) => {
  await signUp(page, testEmail("progress"));

  await page.goto("/progress");
  await expect(page.getByText("No workouts this week")).toBeVisible();
  await expect(page.getByText(/Finish a workout to see how your lifts change/)).toBeVisible();

  await startPushDay(page);
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await finishWorkout(page);

  await startPushDay(page);
  await logSet(page, "Barbell bench press", 0, "145", "3");
  await logSet(page, "Incline dumbbell press", 0, "50", "10");
  await finishWorkout(page);

  await page.goto("/progress");
  const week = page.getByRole("region", { name: "Volume this week" });
  // 135 × 5 + 145 × 3 + 50 × 10
  await expect(week.getByRole("definition").filter({ hasText: "1,610 lb" })).toBeVisible();
  await expect(week.getByRole("img", { name: /^Volume per day this week\. Highest: .*1,610 lb\.$/ })).toBeVisible();
  await expectNoSidewaysScroll(page, "Progress");
  await expectLabelledControls(page, "Progress");

  for (const [tab, region] of [
    ["Month", "Volume this month"],
    ["Year", "Volume this year"],
  ]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(
      page.getByRole("region", { name: region }).getByRole("definition").filter({ hasText: "1,610 lb" })
    ).toBeVisible();
  }

  // The trend starts on the most-logged exercise.
  const exercise = page.getByLabel("Exercise", { exact: true });
  await expect(exercise).toHaveValue("barbell-bench-press");
  await expect(
    page.getByRole("img", { name: /^Top set weight for Barbell bench press over 2 workouts\. Latest 145 lb, up 10 lb/ })
  ).toBeVisible();

  await exercise.selectOption({ label: "Incline dumbbell press" });
  await expect(page.getByText("Log Incline dumbbell press again to see a trend.")).toBeVisible();
  await expectNoSidewaysScroll(page, "Progress trend");
});
