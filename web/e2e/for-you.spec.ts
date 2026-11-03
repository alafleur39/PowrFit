import { expect, test, type Page } from "@playwright/test";

import { expectLabelledControls, expectNoSidewaysScroll, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// P6-02: "For you" suggests videos from your own training (D37); V-03 shows
// them from /api/videos (the fake provider here) and plays them in the app.
// The rules themselves are unit-tested in lib/strength/insights.test.ts.

test.beforeEach(async ({ page }) => {
  await resetEmulators();
  // Thumbnails and the player come from YouTube; tests stay offline.
  await page.route(/^https:\/\/(i\.ytimg\.com|www\.youtube-nocookie\.com)\//, (route) => route.abort());
});

async function finishFirstWorkout(page: Page, label: string) {
  await signUp(page, testEmail(label));
  await expect(page.getByRole("region", { name: "For you" })).toHaveCount(0);
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
}

test("a new lifter gets videos with the reason, and one plays inside PowrFit", async ({ page }) => {
  await finishFirstWorkout(page, "for-you");

  for (const path of ["/home", "/progress"]) {
    await page.goto(path);
    const card = page.getByRole("region", { name: "For you" });
    await expect(card.getByText("Strength training basics")).toBeVisible();
    await expect(card.getByText("You're just getting started")).toBeVisible();
    const videos = card.getByRole("list", { name: "Videos: Strength training basics" });
    await expect(videos.getByRole("button", { name: /^Play / })).toHaveCount(3);
    await expect(videos).toContainText("Test Coach · YouTube");
    await expect(card.getByRole("link", { name: "More on YouTube" })).toHaveAttribute(
      "href",
      /^https:\/\/www\.youtube\.com\/results\?search_query=beginner/
    );
    await expectNoSidewaysScroll(page, `For you on ${path}`);
    await expectLabelledControls(page, `For you on ${path}`);
  }

  await page
    .getByRole("button", { name: "Play beginner strength training program explained (1) by Test Coach" })
    .click();
  const player = page.getByRole("dialog", { name: "beginner strength training program explained (1)" });
  await expect(player.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/aaaaaaaaaa1\?autoplay=1&playsinline=1/
  );
  await expect(player.getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=aaaaaaaaaa1"
  );
  await page.keyboard.press("Escape");
  await expect(player).toHaveCount(0);
});

test("without videos, the suggestion is still a YouTube search link", async ({ page }) => {
  await page.route("**/api/videos?**", (route) => route.fulfill({ status: 502, json: { error: "down" } }));
  await finishFirstWorkout(page, "for-you-fallback");

  await page.goto("/home");
  const link = page.getByRole("region", { name: "For you" }).getByRole("link", { name: /Strength training basics/ });
  await expect(link).toContainText("You're just getting started");
  await expect(link).toHaveAttribute("href", /^https:\/\/www\.youtube\.com\/results\?search_query=beginner/);
  await expect(link).toHaveAttribute("target", "_blank");
});
