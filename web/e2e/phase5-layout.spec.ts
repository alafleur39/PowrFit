import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P5-06: polish found by the P4-08 sweep. Every control a tester touches is
// at least 44px (WCAG), counts read "1 set", and numbers aren't cut off at
// 375px. P5-07: every Phase 5 screen fits, labels its controls and has 44px
// buttons. Set SCREENSHOT_DIR to save a screenshot of each for review.

test.beforeEach(async () => {
  await resetEmulators();
});

async function expect44(locator: Locator, name: string) {
  const box = await locator.first().boundingBox();
  expect(box, name).not.toBeNull();
  // Rounded: WebKit can report 43.99998 for a 44px box mid-animation.
  expect(Math.round(Math.min(box!.width, box!.height)), `${name} size`).toBeGreaterThanOrEqual(44);
}

async function expectNotCutOff(locator: Locator, name: string) {
  const cut = await locator.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(cut, `${name} is cut off`).toBe(false);
}

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

test("polish: tap targets, wording and fit", async ({ page, isMobile }) => {
  await page.goto("/login");
  for (const name of ["Sign In", "Create Account", "Forgot password?"]) await expect44(button(page, name), name);
  await expect44(page.getByLabel("Email address"), "Email field");

  await signUp(page, testEmail("polish"));
  if (isMobile) await expect44(button(page, "Open account menu"), "Account menu");

  await page.getByRole("button", { name: "Start Push day" }).click();
  const bench = page.getByRole("region", { name: "Barbell bench press" });
  await expect(bench.getByLabel("Set 2 reps")).toHaveAttribute("placeholder", "6–8");
  await expect44(bench.getByRole("button", { name: "Remove set 1" }), "Remove set");
  await expect44(bench.getByRole("button", { name: "Remove Barbell bench press" }), "Remove exercise");
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(page.getByText(/· 1 set ·/)).toBeVisible();

  await button(page, "Finish").click();
  const finishDialog = page.getByRole("dialog");
  await expect44(finishDialog.getByRole("button", { name: "Close" }), "Dialog close");
  await finishDialog.getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();

  await page.goto("/workouts?tab=history");
  await expect(page.getByRole("link", { name: /Push day/ })).toContainText("1 set ·");

  await page.goto("/home");
  const week = page.getByRole("region", { name: "This week" });
  if (isMobile) {
    const volume = week.locator("p", { hasText: "675" });
    await expect(volume).toHaveText("675 lb");
    await expectNotCutOff(volume, "Home volume");
  }
  await expect(page.getByRole("region", { name: "Last workout" })).toContainText("1 set ·");
});

async function check(page: Page, screen: string, buttons: string[] = []) {
  await expectNoSidewaysScroll(page, screen);
  await expectLabelledControls(page, screen);
  for (const name of buttons) await expect44(button(page, name), `${screen}: ${name}`);
  const dir = process.env.SCREENSHOT_DIR;
  if (dir) {
    const name = `${test.info().project.name}-p5-${screen.toLowerCase().replace(/\W+/g, "-")}.png`;
    await page.screenshot({ path: `${dir}/${name}` });
  }
}

test("every Phase 5 screen fits and is usable", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("someone@powrfit.test");
  await button(page, "Forgot password?").click();
  await expect(page.getByRole("status")).toBeVisible();
  await check(page, "Login after reset request", ["Forgot password?"]);

  await page.goto("/privacy");
  await check(page, "Privacy");

  await signUp(page, testEmail("phase5-layout"));
  await page.goto("/workouts?tab=explore");
  await expect(page.getByRole("list", { name: "Exercises" })).toBeVisible();
  await check(page, "Explore", ["Chest"]);
  await page.getByRole("list", { name: "Exercises" }).getByRole("button").first().click();
  await check(page, "Exercise detail", ["All exercises"]);

  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Add a note to Barbell bench press" }).click();
  await page.getByLabel("Note for Barbell bench press").fill("Felt strong, add 5 next time");
  await check(page, "Logger with note", ["Add a note to Incline dumbbell press"]);
  await button(page, "Finish").click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Felt strong, add 5 next time")).toBeVisible();
  await check(page, "Summary with note", ["Edit"]);
  await button(page, "Edit").click();
  await check(page, "Edit with note", ["Save changes"]);
  await button(page, "Cancel").click();

  await page.goto("/profile");
  await check(page, "Profile", ["Delete account"]);
  await button(page, "Delete account").click();
  await check(page, "Delete account dialog", ["Keep it", "Delete forever"]);
});
