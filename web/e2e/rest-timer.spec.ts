import { expect, test } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-04: the rest timer (D23) starts when a set is ticked, can be adjusted
// or skipped, and survives a reload.

test.beforeEach(async () => {
  await resetEmulators();
});

test("ticking a set starts a rest timer that survives a reload", async ({ page }) => {
  await signUp(page, testEmail("rest"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  const timer = page.getByRole("region", { name: "Rest timer" });
  await expect(timer).toHaveCount(0);

  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(timer).toBeVisible();
  await expect(timer.getByRole("status")).toHaveText(/^Rest 1:(2\d|30)$/);
  await expectNoSidewaysScroll(page, "Logger with rest timer");
  await expectLabelledControls(page, "Logger with rest timer");

  await timer.getByRole("button", { name: "Add 15 seconds of rest" }).click();
  await expect(timer.getByRole("status")).toHaveText(/^Rest 1:(3[5-9]|4\d)$/);

  // It keeps counting from its end time after a reload.
  await page.reload();
  await expect(timer.getByRole("status")).toHaveText(/^Rest 1:[1-4]\d$/);

  // Elsewhere in the app, the workout strip shows the rest.
  await page.goto("/home");
  await expect(page.getByRole("link", { name: /in progress.*Rest 1:/ })).toBeVisible();
  await page.goto("/log");
  await timer.getByRole("button", { name: "Skip" }).click();
  await expect(timer).toHaveCount(0);

  // Taking time off runs it down to the end.
  await logSet(page, "Barbell bench press", 1, "135", "5");
  const takeOff = timer.getByRole("button", { name: "Take 15 seconds off the rest" });
  for (let i = 0; i < 7 && (await takeOff.isVisible()); i++) {
    // The click that ends the rest removes the button, so it can vanish
    // between the visibility check and the click.
    await takeOff.click({ timeout: 2_000 }).catch(() => undefined);
  }
  await expect(timer.getByRole("status")).toHaveText("Rest over. Next set!");
  await timer.getByRole("button", { name: "Dismiss" }).click();
  await expect(timer).toHaveCount(0);
});
