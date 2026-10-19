import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-02: routines. Create, edit, start, delete; copy a preset; save a
// finished workout as a routine.

test.beforeEach(async () => {
  await resetEmulators();
});

async function pickExercises(page: Page, names: string[]) {
  await page.getByRole("button", { name: "Add exercises" }).click();
  const picker = page.getByRole("dialog", { name: "Add exercises" });
  for (const name of names) {
    await picker.getByPlaceholder("Search exercises").fill(name);
    await picker.getByRole("checkbox", { name: new RegExp(`^${name}`) }).click();
  }
  await picker.getByRole("button", { name: /^Add/ }).click();
  await expect(picker).toHaveCount(0);
}

const myRoutines = (page: Page) => page.getByRole("region", { name: "My routines" });

test("create, start, edit and delete a routine", async ({ page }) => {
  await signUp(page, testEmail("routines"));
  await page.goto("/workouts");
  await expect(myRoutines(page).getByText(/No routines yet/)).toBeVisible();

  await page.getByRole("link", { name: "New routine" }).click();
  await expect(page.getByRole("heading", { name: "New routine" })).toBeVisible();

  // Saving an empty routine explains what's missing.
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(page.getByText("Give the routine a name.")).toBeVisible();

  await page.getByLabel("Routine name").fill("Upper A");
  await pickExercises(page, ["Barbell bench press", "Lat pulldown"]);
  await expectNoSidewaysScroll(page, "Routine editor");
  await expectLabelledControls(page, "Routine editor");
  await page.getByLabel("Sets for Barbell bench press").selectOption("2");
  await page.getByLabel("Reps for Barbell bench press").fill("5");
  await page.getByLabel("Rest for Barbell bench press").selectOption("120");
  await page.getByRole("button", { name: "Move Lat pulldown up" }).click();
  await page.getByRole("button", { name: "Save routine" }).click();

  await expect(page).toHaveURL(/\/workouts$/);
  await expect(myRoutines(page).getByRole("heading", { name: "Upper A" })).toBeVisible();
  await expect(myRoutines(page).getByText("2 exercises · 5 sets")).toBeVisible();
  await expectNoSidewaysScroll(page, "Routines");
  await expectLabelledControls(page, "Routines");

  // Starting it builds the workout from the routine, in the edited order.
  await page.getByRole("button", { name: "Start Upper A" }).click();
  await expect(page).toHaveURL(/\/log$/);
  await expect(page.getByRole("heading", { name: "Upper A" })).toBeVisible();
  const cards = page.getByRole("region", { name: /^(Lat pulldown|Barbell bench press)$/ });
  await expect(cards.first()).toHaveAccessibleName("Lat pulldown");
  const bench = page.getByRole("region", { name: "Barbell bench press" });
  await expect(bench.getByLabel(/^Set \d+ reps/)).toHaveCount(2);
  await page.getByRole("button", { name: "Discard workout" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Discard workout" }).click();

  // Edit: rename and remove an exercise.
  await page.goto("/workouts");
  await page.getByRole("link", { name: "Edit Upper A" }).click();
  await expect(page.getByLabel("Routine name")).toHaveValue("Upper A");
  await page.getByLabel("Routine name").fill("Upper B");
  await page.getByRole("button", { name: "Remove Lat pulldown" }).click();
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(myRoutines(page).getByRole("heading", { name: "Upper B" })).toBeVisible();
  await expect(myRoutines(page).getByText("1 exercise · 2 sets")).toBeVisible();

  // Delete with confirmation.
  await page.getByRole("link", { name: "Edit Upper B" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete routine" }).click();
  await expect(page).toHaveURL(/\/workouts$/);
  await expect(myRoutines(page).getByText(/No routines yet/)).toBeVisible();
});

test("copy a preset into my routines and edit the copy", async ({ page }) => {
  await signUp(page, testEmail("copy"));
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Copy Leg day to my routines" }).click();
  await expect(page.getByRole("heading", { name: "Edit routine" })).toBeVisible();
  await page.getByLabel("Routine name").fill("My legs");
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(myRoutines(page).getByRole("heading", { name: "My legs" })).toBeVisible();
  // The preset itself is unchanged.
  await expect(page.getByRole("region", { name: "Presets" }).getByRole("heading", { name: "Leg day" })).toBeVisible();
});

test("save a finished workout as a routine", async ({ page }) => {
  await signUp(page, testEmail("saveas"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "8");
  await logSet(page, "Barbell bench press", 1, "135", "6");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();

  await page.getByRole("button", { name: "Save as routine" }).click();
  const dialog = page.getByRole("dialog", { name: "Save as routine" });
  await expect(dialog.getByLabel("Routine name")).toHaveValue("Push day");
  await dialog.getByLabel("Routine name").fill("Bench focus");
  await dialog.getByRole("button", { name: "Save routine" }).click();
  await expect(page.getByRole("status")).toContainText("Saved to My routines");

  // It shows on the Start panel and in Workouts with the sets that were done.
  await page.getByRole("link", { name: "Done" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/log");
  await expect(page.getByRole("button", { name: /^Bench focus/ })).toBeVisible();
  await page.goto("/workouts");
  await expect(myRoutines(page).getByText("1 exercise · 2 sets")).toBeVisible();
});
