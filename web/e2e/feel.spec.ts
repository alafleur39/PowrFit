import { expect, test } from "@playwright/test";

import { resetEmulators, signUp, testEmail } from "./helpers";

// P6-10: taps answer visibly, and screen changes animate with the View
// Transitions API (Reduce Motion respected). Desktop Chrome, where both can
// be observed; iPhone Safari gets the same CSS.

test.beforeEach(async () => {
  await resetEmulators();
});

test("buttons press in, and screen changes run a view transition", async ({ page, isMobile }) => {
  test.skip(isMobile, "observed in desktop Chrome");
  await signUp(page, testEmail("feel"));

  const start = page.getByRole("button", { name: "Start Push day" });
  const box = await start.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect.poll(() => start.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.75");
  await page.mouse.move(0, 0);
  await page.mouse.up();

  await page.evaluate(() => {
    const original = document.startViewTransition.bind(document);
    (window as unknown as { transitions: number }).transitions = 0;
    document.startViewTransition = ((...args: Parameters<typeof original>) => {
      (window as unknown as { transitions: number }).transitions += 1;
      return original(...args);
    }) as typeof document.startViewTransition;
  });
  await page.getByRole("link", { name: "Workouts" }).first().click();
  await expect(page.getByRole("heading", { name: "Workouts" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBeGreaterThan(0);
});

test("Reduce Motion turns off the press-in", async ({ page, isMobile }) => {
  test.skip(isMobile, "observed in desktop Chrome");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signUp(page, testEmail("feel-reduced"));
  const start = page.getByRole("button", { name: "Start Push day" });
  const box = await start.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect.poll(() => start.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.75");
  expect(await start.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await page.mouse.move(0, 0);
  await page.mouse.up();
});
