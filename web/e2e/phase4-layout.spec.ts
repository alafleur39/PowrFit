import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-08: layout sweep of every Phase 4 screen at 375px-class and 1440px.
// Each screen must fit without sideways scrolling, label its controls, and
// give its main buttons a 44px tap target (WCAG). Set SCREENSHOT_DIR to save
// a screenshot of each screen for a visual check.

test.beforeEach(async () => {
  await resetEmulators();
});

async function check(page: Page, screen: string, buttons: string[] = []) {
  await expectNoSidewaysScroll(page, screen);
  await expectLabelledControls(page, screen);
  for (const name of buttons) {
    const box = await page.getByRole("button", { name, exact: true }).first().boundingBox();
    expect(box, `${screen}: ${name}`).not.toBeNull();
    // Rounded: WebKit can report 43.99998 for a 44px box mid-animation.
    expect(Math.round(Math.min(box!.width, box!.height)), `${screen}: ${name} size`).toBeGreaterThanOrEqual(44);
  }
  const dir = process.env.SCREENSHOT_DIR;
  if (dir) {
    const name = `${test.info().project.name}-${screen.toLowerCase().replace(/\W+/g, "-")}.png`;
    await page.screenshot({ path: `${dir}/${name}` });
  }
}

async function finish(page: Page) {
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
}

test("every Phase 4 screen fits and is usable", async ({ page }) => {
  await signUp(page, testEmail("phase4-layout"));

  // Routines tab and editor (P4-02).
  await page.goto("/workouts");
  await expect(page.getByRole("region", { name: "Presets" })).toBeVisible();
  await check(page, "Routines tab", ["Start Push day", "Copy Push day to my routines"]);
  await page.getByRole("link", { name: "New routine" }).click();
  await page.getByLabel("Routine name").fill("Layout check");
  await check(page, "Routine editor", ["Save routine", "Add exercises"]);
  await page.getByRole("button", { name: "Add exercises" }).click();
  const picker = page.getByRole("dialog", { name: "Add exercises" });
  await picker.getByPlaceholder("Search exercises").fill("Lat pulldown");
  await picker.getByRole("checkbox", { name: /^Lat pulldown/ }).click();
  await picker.getByRole("button", { name: /^Add/ }).click();
  await check(page, "Routine editor with exercise", ["Remove Lat pulldown"]);

  // Logger with the rest timer (P4-04), then a PR on the second workout (P4-03).
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(page.getByRole("region", { name: "Rest timer" })).toBeVisible();
  await check(page, "Logger with rest timer", ["Skip"]);
  await finish(page);

  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "155", "3");
  await finish(page);
  await expect(page.getByText(/new PR/).first()).toBeVisible();
  await check(page, "Summary with PR", ["Edit", "Save as routine"]);

  // Edit and delete (P4-05).
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await check(page, "Edit workout", [
    "Save changes",
    "Delete workout",
    "Remove Barbell bench press",
    "Remove Barbell bench press set 1",
  ]);
  await page.getByRole("button", { name: "Delete workout" }).click();
  await check(page, "Delete workout dialog", ["Keep it", "Delete"]);
  await page.getByRole("dialog").getByRole("button", { name: "Keep it" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  // History with PR counts, Progress (P4-06) and Home's install card (P4-07, iPhone).
  await page.goto("/workouts?tab=history");
  await expect(page.getByText(/1 PR/).first()).toBeVisible();
  await check(page, "History with PRs");

  await page.goto("/progress");
  await expect(page.getByRole("region", { name: "Volume this week" })).toBeVisible();
  await check(page, "Progress");

  await page.goto("/home");
  await expect(page.getByRole("region", { name: "Last workout" })).toBeVisible();
  const install = page.getByRole("region", { name: "Add PowrFit to your home screen" });
  if (test.info().project.name === "iphone-13") await expect(install).toBeVisible();
  await check(page, "Home", test.info().project.name === "iphone-13" ? ["Not now"] : []);
});
