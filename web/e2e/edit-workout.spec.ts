import { expect, test, type Page } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  listWorkoutLogs,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P4-05: edit and delete a past workout (D24), online and offline.

test.beforeEach(async () => {
  await resetEmulators();
});

const BENCH = "Barbell bench press";

async function finishBenchWorkout(page: Page) {
  await page.goto("/workouts");
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, BENCH, 0, "135", "6");
  await logSet(page, BENCH, 1, "135", "6");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 30_000 });
}

/** The bench sets saved in the emulator, as "weight×reps". */
async function savedBenchSets(): Promise<string[]> {
  const [doc] = await listWorkoutLogs();
  if (!doc) return [];
  type Value = { integerValue?: string; doubleValue?: number; mapValue?: { fields: Record<string, Value> }; arrayValue?: { values?: Value[] } };
  const num = (value: Value) => Number(value.integerValue ?? value.doubleValue);
  const exercises = (doc.fields.exercises as Value).arrayValue?.values ?? [];
  const sets = exercises[0]?.mapValue?.fields.sets.arrayValue?.values ?? [];
  return sets.map((set) => {
    const fields = set.mapValue!.fields;
    return `${num(fields.weight)}×${num(fields.reps)}`;
  });
}

const weight = (page: Page, set: number) => page.getByLabel(new RegExp(`^${BENCH} set ${set} weight`));
const reps = (page: Page, set: number) => page.getByLabel(`${BENCH} set ${set} reps`);

test("edit a past workout's sets, then delete it", async ({ page }) => {
  await signUp(page, testEmail("edit"));
  await finishBenchWorkout(page);

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit workout" })).toBeVisible();
  await expectNoSidewaysScroll(page, "Edit workout");
  await expectLabelledControls(page, "Edit workout");

  // A cleared reps field blocks saving.
  await reps(page, 2).fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Every set needs at least 1 rep.")).toBeVisible();

  await weight(page, 2).fill("145");
  await reps(page, 2).fill("4");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Edit workout" })).toHaveCount(0);
  await expect(page.getByText("145 × 4")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect.poll(savedBenchSets).toEqual(["135×6", "145×4"]);

  // Delete asks first; "Keep it" changes nothing.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Delete workout" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this workout?" });
  await dialog.getByRole("button", { name: "Keep it" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await listWorkoutLogs()).toHaveLength(1);

  await page.getByRole("button", { name: "Delete workout" }).click();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Workout deleted.")).toBeVisible();
  await expect.poll(async () => (await listWorkoutLogs()).length).toBe(0);
  await page.goto("/workouts?tab=history");
  await expect(page.getByText("No workouts yet")).toBeVisible();
});

test("edits and deletes made offline sync when the connection returns", async ({
  page,
  context,
}) => {
  await signUp(page, testEmail("edit-offline"));
  await finishBenchWorkout(page);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: `Remove ${BENCH} set 1` }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Waiting to sync")).toBeVisible();
  expect(await savedBenchSets()).toEqual(["135×6", "135×6"]);

  await context.setOffline(false);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 45_000 });
  await expect.poll(savedBenchSets).toEqual(["135×6"]);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Delete workout" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Workout deleted.")).toBeVisible();
  expect(await listWorkoutLogs()).toHaveLength(1);

  await context.setOffline(false);
  await expect.poll(async () => (await listWorkoutLogs()).length, { timeout: 45_000 }).toBe(0);
});
