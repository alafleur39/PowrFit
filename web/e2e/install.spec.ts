import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-07: Home suggests installing PowrFit after the 2nd workout (D26).

test.beforeEach(async () => {
  await resetEmulators();
});

const card = (page: Page) => page.getByRole("region", { name: "Add PowrFit to your home screen" });

async function finishWorkout(page: Page) {
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
}

async function goHome(page: Page) {
  await page.goto("/home");
  await expect(page.getByRole("region", { name: "Last workout" })).toBeVisible();
}

test("on iPhone, explains Share → Add to Home Screen until Not now", async ({ page, isMobile }) => {
  test.skip(!isMobile, "iPhone only");
  await signUp(page, testEmail("install-ios"));

  await finishWorkout(page);
  await goHome(page);
  await expect(card(page)).toHaveCount(0);

  await finishWorkout(page);
  await goHome(page);
  await expect(card(page)).toContainText("Add to Home Screen");
  await expect(card(page).getByRole("button", { name: "Install" })).toHaveCount(0);
  await expectNoSidewaysScroll(page, "Home with install card");
  await expectLabelledControls(page, "Home with install card");

  await card(page).getByRole("button", { name: "Not now" }).click();
  await expect(card(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Last workout" })).toBeVisible();
  await expect(card(page)).toHaveCount(0);
});

test("where the browser offers it, Install opens the browser's prompt", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop Chrome only");
  await signUp(page, testEmail("install-prompt"));
  await finishWorkout(page);
  await finishWorkout(page);
  await goHome(page);

  // No install event yet (dev builds don't qualify): nothing to offer.
  await expect(card(page)).toHaveCount(0);

  // Stand in for Chrome's event; record whether the app called prompt().
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => {
        (window as unknown as { promptShown: boolean }).promptShown = true;
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await expect(card(page)).toContainText("works offline");
  await expectNoSidewaysScroll(page, "Home with install card");

  await card(page).getByRole("button", { name: "Install" }).click();
  await expect(card(page)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { promptShown?: boolean }).promptShown)).toBe(true);
});
