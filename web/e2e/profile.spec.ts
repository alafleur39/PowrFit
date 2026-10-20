import { expect, test } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  listDocuments,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P6-13: Profile with a display name, a photo-free avatar (D41), lifetime
// stats worked out from history, and the unit.

test.beforeEach(async () => {
  await resetEmulators();
});

/** A lifetime stat on Profile (the desktop stats rail has its own "Workouts"). */
const stat = (page: import("@playwright/test").Page, label: string) =>
  page.locator(`dl[aria-label="Lifetime"] dt:text-is("${label}") + dd`);

test("edit your name and avatar, and see lifetime stats", async ({ page, isMobile }) => {
  const email = testEmail("profile");
  await signUp(page, email);
  await page.goto("/profile");

  // Starts from the email's name part.
  const local = email.split("@")[0];
  await expect(page.getByRole("heading", { name: local })).toBeVisible();
  await expect(stat(page, "Workouts")).toHaveText("0");
  await expectNoSidewaysScroll(page, "Profile");
  await expectLabelledControls(page, "Profile");

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Display name").fill(" ");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Enter a display name.")).toBeVisible();
  await page.getByLabel("Display name").fill("Andy Lafleur");
  await page.getByRole("radio", { name: "blue" }).click();
  await expectLabelledControls(page, "Profile editor");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Andy Lafleur" })).toBeVisible();
  if (isMobile) await expect(page.getByRole("button", { name: "Open account menu" })).toHaveText("AL");
  await expect
    .poll(async () => JSON.stringify((await listDocuments("settings")).map((d) => d.fields)))
    .toContain("Andy Lafleur");

  // Saved to the account: a reload keeps it.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Andy Lafleur" })).toBeVisible();

  // Stats come from history.
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "100", "5");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  await page.goto("/profile");
  await expect(stat(page, "Workouts")).toHaveText("1");
  await expect(stat(page, "Total volume")).toHaveText("500 lb");
  await expect(stat(page, "Week streak")).toHaveText("1");

  await page.getByRole("radio", { name: "kg" }).click();
  await expect(stat(page, "Total volume")).toHaveText("226.8 kg");
});
