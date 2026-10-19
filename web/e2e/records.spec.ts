import { expect, test, type Page } from "@playwright/test";

import { expectNoSidewaysScroll, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// P4-03: personal-record badges (D22) while logging, on the summary and in History.

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

test("a heavier set than ever before is marked as a PR", async ({ page }) => {
  await signUp(page, testEmail("records"));

  // The first time doesn't count.
  await startPushDay(page);
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(page.getByText(/is a new personal record/)).toHaveCount(0);
  await finishWorkout(page);
  await expect(page.getByText(/new PR/)).toHaveCount(0);

  // Heavier next time: marked while logging, then on the summary.
  await startPushDay(page);
  const bench = page.getByRole("region", { name: "Barbell bench press" });
  await expect(bench.getByText(/^Last:/)).toBeVisible();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(page.getByText(/is a new personal record/)).toHaveCount(0);
  await logSet(page, "Barbell bench press", 1, "145", "3");
  await expect(bench.getByText("Set 2 is a new personal record")).toBeAttached();
  await expectNoSidewaysScroll(page, "Logger with a PR");
  await finishWorkout(page);
  await expect(page.getByText("1 new PR")).toBeVisible();
  await expect(page.getByText("145 × 3").first()).toBeVisible();

  // History shows which workout set it.
  await page.goto("/workouts?tab=history");
  const items = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: /Push day/ }) });
  await expect(items).toHaveCount(2);
  await expect(items.first().getByText("1 PR")).toBeVisible();
  await expect(items.nth(1).getByText(/PR/)).toHaveCount(0);
});
