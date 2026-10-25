import { expect, test } from "@playwright/test";

import {
  TEST_PASSWORD,
  expectLabelledControls,
  expectNoSidewaysScroll,
  listDocuments,
  logSet,
  openAccountMenu,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P5-05: feedback (D30), the privacy page and deleting an account (D31).

test.beforeEach(async () => {
  await resetEmulators();
});

test("the privacy page is public and linked from login and Profile", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
  await expect(page.getByText(/No ads, no selling/)).toBeVisible();
  await expectNoSidewaysScroll(page, "Privacy");
  await expectLabelledControls(page, "Privacy");

  await signUp(page, testEmail("privacy"));
  await page.goto("/profile");
  await expect(page.getByRole("link", { name: /Send feedback/ })).toHaveAttribute(
    "href",
    "https://example.com/powrfit-feedback"
  );
  await expectNoSidewaysScroll(page, "Profile");
  await expectLabelledControls(page, "Profile");
  await page.getByRole("link", { name: /Privacy/ }).click();
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
});

test("deleting an account removes its data and login", async ({ page, isMobile }) => {
  const email = testEmail("delete");
  await signUp(page, email);

  // Something in every collection: a workout, a routine and a setting.
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Copy Push day to my routines" }).click();
  await page.getByRole("button", { name: "Save routine" }).click();
  await page.getByRole("button", { name: "Start Push day" }).first().click();
  await logSet(page, "Barbell bench press", 0, "135", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 30_000 });
  await openAccountMenu(page, isMobile);
  await page.getByRole("radio", { name: "kg" }).click();
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await listDocuments("settings")).length).toBe(1);
  expect(await listDocuments("routines")).toHaveLength(1);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expectNoSidewaysScroll(page, "Delete account dialog");

  await dialog.getByLabel("Password").fill("not-the-password");
  await dialog.getByRole("button", { name: "Delete forever" }).click();
  await expect(dialog.getByText("That password isn't right.")).toBeVisible();
  expect(await listDocuments("workoutLogs")).toHaveLength(1);

  await dialog.getByLabel("Password").fill(TEST_PASSWORD);
  await dialog.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  for (const collection of ["workoutLogs", "routines", "settings"]) {
    expect(await listDocuments(collection), collection).toHaveLength(0);
  }

  // The login is gone too.
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByText(/Incorrect email or password|couldn.t find an account/)).toBeVisible();
});
