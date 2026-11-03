import { expect, test } from "@playwright/test";

import { logSet, resetEmulators, signUp, testEmail } from "./helpers";

// UI playbook Phase 4, the logger: ✓ on an empty set fills in the set above
// and ticks it (one tap), and steppers nudge weight and reps.

test.beforeEach(async () => {
  await resetEmulators();
});

test("one tap repeats the last set, and steppers adjust weight and reps", async ({ page }) => {
  await signUp(page, testEmail("logger"));
  await page.getByRole("button", { name: "Start Push day" }).click();
  const bench = page.getByRole("region", { name: "Barbell bench press" });

  await logSet(page, "Barbell bench press", 0, "135", "5");
  await expect(bench.getByLabel(/^Set 2 weight/)).toHaveAttribute("placeholder", "135");

  await bench.getByRole("button", { name: "Set 2 not done" }).click();
  await expect(bench.getByRole("button", { name: "Set 2 done" })).toBeVisible();
  await expect(bench.getByLabel(/^Set 2 weight/)).toHaveValue("135");
  await expect(bench.getByLabel("Set 2 reps")).toHaveValue("5");

  await bench.getByLabel(/^Set 3 weight/).focus();
  await bench.getByRole("button", { name: "Add 5 lb to set 3" }).click();
  await expect(bench.getByLabel(/^Set 3 weight/)).toHaveValue("140");
  await bench.getByLabel("Set 3 reps").focus();
  await bench.getByRole("button", { name: "One rep fewer on set 3" }).click();
  await expect(bench.getByLabel("Set 3 reps")).toHaveValue("4");
});
