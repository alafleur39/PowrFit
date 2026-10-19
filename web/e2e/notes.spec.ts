import { expect, test } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  listWorkoutLogs,
  logSet,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P5-02: a note per exercise (D27), from the logger to the summary and edit.

test.beforeEach(async () => {
  await resetEmulators();
});

/** The first exercise's saved note in the emulator. */
async function savedNote(): Promise<string | undefined> {
  const [doc] = await listWorkoutLogs();
  type Value = { stringValue?: string; mapValue?: { fields: Record<string, Value> }; arrayValue?: { values?: Value[] } };
  const exercises = (doc?.fields.exercises as Value | undefined)?.arrayValue?.values ?? [];
  return exercises[0]?.mapValue?.fields.note?.stringValue;
}

test("an exercise note survives a reload, saves, and can be edited", async ({ page }) => {
  await signUp(page, testEmail("notes"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  await logSet(page, "Barbell bench press", 0, "135", "5");

  await page.getByRole("button", { name: "Add a note to Barbell bench press" }).click();
  await page.getByLabel("Note for Barbell bench press").fill("Pause on the chest");
  await expectNoSidewaysScroll(page, "Logger with note");
  await expectLabelledControls(page, "Logger with note");

  // The note is part of the draft, so a reload keeps it.
  await page.reload();
  await expect(page.getByLabel("Note for Barbell bench press")).toHaveValue("Pause on the chest");

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish and save" }).click();
  await expect(page.getByText("Pause on the chest")).toBeVisible();
  await expect.poll(savedNote).toBe("Pause on the chest");

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Note for Barbell bench press").fill("Pause on the chest, 2 s");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Pause on the chest, 2 s")).toBeVisible();
  await expect.poll(savedNote).toBe("Pause on the chest, 2 s");
});
