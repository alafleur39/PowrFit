import { expect, test, type Page } from "@playwright/test";

import { listWorkoutLogs, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// Phase 2 gates 1–3: start, log three sets, finish, reopen; only ticked sets
// count; Home, History and Summary show the same totals.

test.beforeEach(async () => {
  await resetEmulators();
});

/** Logs 135×8, 62.5×10 (typed with a comma) and 135×6 of bench press. */
async function logPushDay(page: Page) {
  await page.getByRole("button", { name: "Start Push day" }).click();
  await expect(page).toHaveURL(/\/log$/);
  await logSet(page, "Barbell bench press", 0, "135", "8");
  await logSet(page, "Barbell bench press", 1, "62,5", "10");
  await logSet(page, "Barbell bench press", 2, "135", "6");
  await expect(page.getByText("3 sets · 2,515 lb")).toBeVisible();
}

async function finish(page: Page) {
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Finish workout?" });
  await expect(dialog.getByText(/unticked sets will be discarded/)).toBeVisible();
  await dialog.getByRole("button", { name: "Finish and save" }).click();
  // The summary appears in place (no network needed), then History reopens it.
  await expect(page).toHaveURL(/\/log$/);
  await expect(page.getByText("Workout saved")).toBeVisible();
}

async function expectSummary(page: Page) {
  await expect(page.getByRole("heading", { name: "Push day", level: 1 })).toBeVisible();
  await expect(page.getByText("Synced")).toBeVisible();
  const stats = page.locator("dl").first();
  await expect(stats.getByText("2,515 lb")).toBeVisible();
  await expect(stats.getByText("24", { exact: true })).toBeVisible();
  // Only the ticked bench sets were saved; the other Push day exercises were dropped.
  await expect(page.getByRole("heading", { name: "Barbell bench press" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cable fly" })).toHaveCount(0);
}

test("a workout can be started, logged, finished and reopened with matching totals", async ({
  page,
  isMobile,
}) => {
  await signUp(page, testEmail("core"));
  await logPushDay(page);
  await finish(page);
  await expectSummary(page);

  // History lists it with the same totals, and reopening shows the same summary.
  await page.goto("/workouts?tab=history");
  const row = page.getByRole("link", { name: /Push day/ });
  await expect(row).toContainText("3 sets · 2,515 lb");
  await expect(row).toContainText("Synced");
  await row.click();
  await expect(page).toHaveURL(/\/workouts\/history\/[0-9a-f-]{36}$/);
  await expectSummary(page);

  // Home's week stats and last-workout card agree.
  await page.goto("/home");
  const week = isMobile
    ? page.getByRole("region", { name: "This week" })
    : page.getByRole("complementary").filter({ hasText: "This week" });
  await expect(week).toContainText("Workouts1");
  await expect(week).toContainText("Sets3");
  await expect(week).toContainText("2,515 lb");
  await expect(page.getByRole("region", { name: "Last workout" })).toContainText("2,515 lb");

  // The server holds exactly one document with only the three ticked sets.
  const logs = await listWorkoutLogs();
  expect(logs).toHaveLength(1);
  expect(JSON.stringify(logs[0].fields.totals)).toContain('"volume"');
  expect(JSON.stringify(logs[0].fields.totals)).toMatch(/"integerValue":"3"/);
});

test("a workout with no ticked sets can't be finished", async ({ page }) => {
  await signUp(page, testEmail("empty"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nothing to save yet" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Finish and save" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Keep logging" }).click();
  await expect(page).toHaveURL(/\/log$/);
});
