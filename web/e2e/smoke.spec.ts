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

test("old path-style addresses land on the query-style pages (P7-01)", async ({ page }) => {
  await signUp(page, testEmail("old-links"));
  await page.goto("/workouts/routines/new");
  await expect(page).toHaveURL(/\/workouts\/routines\/edit\?id=new$/);
  const id = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";
  await page.goto(`/workouts/history/${id}`);
  await expect(page).toHaveURL(new RegExp(`/workouts/history/view\\?id=${id}$`));
});
