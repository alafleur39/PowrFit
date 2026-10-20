import { expect, test } from "@playwright/test";

import { expectLabelledControls, expectNoSidewaysScroll, logSet, resetEmulators, signUp, testEmail } from "./helpers";

// P6-02: "For you" suggests videos from your own training (D37). The rules
// themselves are unit-tested in lib/strength/insights.test.ts.

test.beforeEach(async () => {
  await resetEmulators();
});

test("a new lifter gets a suggestion with its reason and a YouTube link", async ({ page }) => {
  await signUp(page, testEmail("for-you"));
  await expect(page.getByRole("region", { name: "For you" })).toHaveCount(0);

  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();

  for (const path of ["/home", "/progress"]) {
    await page.goto(path);
    const card = page.getByRole("region", { name: "For you" });
    const link = card.getByRole("link", { name: /Strength training basics/ });
    await expect(link).toContainText("You're just getting started");
    await expect(link).toHaveAttribute("href", /^https:\/\/www\.youtube\.com\/results\?search_query=beginner/);
    await expect(link).toHaveAttribute("target", "_blank");
    await expectNoSidewaysScroll(page, `For you on ${path}`);
    await expectLabelledControls(page, `For you on ${path}`);
  }
});
