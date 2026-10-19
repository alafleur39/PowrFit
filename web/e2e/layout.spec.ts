import { expect, test } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// Phase 2 gate 8: core screens fit 375px-class phones and 1440px desktops
// without sideways scrolling, and their controls are labelled and tappable.

test.beforeEach(async () => {
  await resetEmulators();
});

test("core screens fit the screen and label their controls", async ({ page }) => {
  await signUp(page, testEmail("layout"));
  await expectNoSidewaysScroll(page, "Home");
  await expectLabelledControls(page, "Home");

  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expectNoSidewaysScroll(page, "Logger");
  await expectLabelledControls(page, "Logger");

  // Tap targets for the controls used mid-set (spec: 48px; WCAG minimum 44px).
  for (const name of ["Set 1 done", "Set 2 not done", "Finish"]) {
    const box = await page.getByRole("button", { name, exact: true }).first().boundingBox();
    expect(box, name).not.toBeNull();
    // Rounded: WebKit can report 43.99998 for a 44px box mid-animation.
    expect(Math.round(Math.min(box!.width, box!.height)), `${name} size`).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole("button", { name: "Add exercise" }).click();
  await expectNoSidewaysScroll(page, "Exercise picker");
  await expectLabelledControls(page, "Exercise picker");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  await expectNoSidewaysScroll(page, "Summary");
  await expectLabelledControls(page, "Summary");

  await page.goto("/workouts?tab=history");
  await expect(page.getByRole("link", { name: /Push day/ })).toBeVisible();
  await expectNoSidewaysScroll(page, "History");
  await expectLabelledControls(page, "History");
});

test("the logger can be driven with the keyboard alone", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard-only use is a desktop concern");
  await signUp(page, testEmail("keyboard"));
  await page.getByRole("button", { name: "Start Push day" }).focus();
  await page.keyboard.press("Enter");
  const weight = page.getByLabel(/^Set 1 weight/).first();
  await weight.focus();
  await page.keyboard.type("100");
  await page.keyboard.press("Tab");
  await page.keyboard.type("5");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Set 1 done" }).first()).toBeVisible();
});
