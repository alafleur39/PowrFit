import { expect, test } from "@playwright/test";

import { resetEmulators, signUp, testEmail } from "./helpers";

test.beforeEach(async () => {
  await resetEmulators();
});

test("signing up lands on Home with the start card", async ({ page }) => {
  await signUp(page, testEmail("smoke"));
  await expect(page.getByRole("heading", { name: "Home", level: 1 })).toBeVisible();
  await expect(page.getByText("Start your first workout")).toBeVisible();
});

test("signed-out visitors to / end on the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
