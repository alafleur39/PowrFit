import { expect, test, type Locator, type Page } from "@playwright/test";

import { logSet, resetEmulators, signUp, testEmail } from "./helpers";

// P5-06: polish found by the P4-08 sweep. Every control a tester touches is
// at least 44px (WCAG), counts read "1 set", and numbers aren't cut off at
// 375px.

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
