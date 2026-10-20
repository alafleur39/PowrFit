import { expect, test, type Page } from "@playwright/test";

import { expectNoSidewaysScroll, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// P6-09 + P6-11 (D39, D40): swipeable top tabs that keep every panel loaded,
// and screens that reopen without a loading state. A horizontal wheel drives
// the same scroll snapping a finger does on an iPhone.

test.beforeEach(async () => {
  await resetEmulators();
});

const tab = (page: Page, name: string) => page.getByRole("tab", { name, exact: true });

/**
 * Scrolls the tab row sideways by one screen, like a swipe. Mobile WebKit
 * has no wheel in Playwright, so there the row is scrolled directly: the
 * same scroll a finger produces, with the same snapping.
 */
async function swipe(page: Page, direction: 1 | -1) {
  const row = page.getByRole("tabpanel").first().locator("..");
  if (test.info().project.name === "iphone-13") {
    await row.evaluate((el, d) => el.scrollBy({ left: d * el.clientWidth, behavior: "smooth" }), direction);
    return;
  }
  const box = await row.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 40);
  await page.mouse.wheel(direction * box!.width, 0);
}

async function expectSelected(page: Page, name: string) {
  await expect(tab(page, name)).toHaveAttribute("aria-selected", "true");
}

test("Workouts tabs swipe, keep their content and their scroll", async ({ page }) => {
  await signUp(page, testEmail("swipe"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();

  await page.goto("/workouts");
  await expectSelected(page, "Routines");
  await expect(page.getByText("Loading your routines…")).toHaveCount(0);

  // Swipe to History: the tab, the URL and the underline follow.
  await swipe(page, 1);
  await expectSelected(page, "History");
  await expect(page).toHaveURL(/[?&]tab=history/);
  await expect(page.getByRole("link", { name: /Push day/ })).toBeVisible();
  const underline = await page.locator('[role="tablist"] > span').boundingBox();
  const historyTab = await tab(page, "History").boundingBox();
  expect(underline!.x).toBeGreaterThanOrEqual(historyTab!.x);
  expect(underline!.x + underline!.width).toBeLessThanOrEqual(historyTab!.x + historyTab!.width + 1);

  // Swiping back finds Routines already loaded: no spinner, no "Loading".
  await swipe(page, -1);
  await expectSelected(page, "Routines");
  await expect(page.getByText("Loading your routines…")).toHaveCount(0);
  await expectNoSidewaysScroll(page, "Workouts after swiping");

  // Explore: sideways scrolling inside the muscle chips stays in the chips.
  // (A real wheel is needed to chain a scroll, so desktop only.)
  await tab(page, "Explore").click();
  await expectSelected(page, "Explore");
  if (test.info().project.name !== "iphone-13") {
    const chips = page.getByRole("group", { name: "Muscle" });
    const chipsBox = await chips.boundingBox();
    await page.mouse.move(chipsBox!.x + chipsBox!.width / 2, chipsBox!.y + chipsBox!.height / 2);
    await page.mouse.wheel(2000, 0);
    await page.mouse.wheel(2000, 0);
    await expectSelected(page, "Explore");
    await page.mouse.move(10, 10);
  }

  // Each tab comes back where it was left.
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const exploreY = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 0));
  await tab(page, "Routines").click();
  await expectSelected(page, "Routines");
  await page.evaluate((y) => window.scrollTo(0, y), exploreY);
  await tab(page, "Explore").click();
  await expectSelected(page, "Explore");
  await tab(page, "Routines").click();
  await expectSelected(page, "Routines");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(exploreY);

  // A link to a tab still opens it.
  await page.goto("/workouts?tab=explore");
  await expectSelected(page, "Explore");
});

test("screens reopen without a loading state", async ({ page }) => {
  await signUp(page, testEmail("revisit"));
  await page.goto("/workouts");
  await expect(page.getByText(/No routines yet/)).toBeVisible();

  // Leave and come back through the app's own navigation.
  await page.getByRole("link", { name: "Home" }).first().click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await page.getByRole("link", { name: "Workouts" }).first().click();
  await expect(page.getByText(/No routines yet/)).toBeVisible();
  await expect(page.getByText("Loading your routines…")).toHaveCount(0);
});

test("Progress tabs swipe between week, month and year", async ({ page }) => {
  await signUp(page, testEmail("swipe-progress"));
  await page.goto("/progress");
  await expectSelected(page, "Week");
  await swipe(page, 1);
  await expectSelected(page, "Month");
  await expect(page.getByText("No workouts this month")).toBeVisible();
  await swipe(page, 1);
  await expectSelected(page, "Year");
  await expectNoSidewaysScroll(page, "Progress after swiping");
});
