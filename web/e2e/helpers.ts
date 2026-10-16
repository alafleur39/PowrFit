import { readFileSync } from "node:fs";

import { expect, type Page } from "@playwright/test";

// Talks to the local Firebase emulators (demo-powrfit) over their REST APIs.
const PROJECT = "demo-powrfit";
const FIRESTORE = "http://127.0.0.1:8080";
const AUTH = "http://127.0.0.1:9099";

/** Deletes every document and every account in the emulators. */
export async function resetEmulators(): Promise<void> {
  const responses = await Promise.all([
    fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {
      method: "DELETE",
    }),
    fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" }),
  ]);
  for (const response of responses) expect(response.ok).toBe(true);
}

/** Replaces the emulator's Firestore rules (to force a rejected save). */
export async function setFirestoreRules(rules: string): Promise<void> {
  const response = await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules: { files: [{ name: "firestore.rules", content: rules }] } }),
  });
  expect(response.ok).toBe(true);
}

/** All workoutLogs documents in the emulator, across users (admin view). */
export async function listWorkoutLogs(): Promise<{ path: string; fields: Record<string, unknown> }[]> {
  const response = await fetch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({
        structuredQuery: { from: [{ collectionId: "workoutLogs", allDescendants: true }] },
      }),
    }
  );
  expect(response.ok).toBe(true);
  const rows = (await response.json()) as { document?: { name: string; fields: Record<string, unknown> } }[];
  return rows.flatMap((row) => (row.document ? [{ path: row.document.name, fields: row.document.fields }] : []));
}

let counter = 0;
/** A unique emulator-only email for this run. */
export function testEmail(label: string): string {
  counter += 1;
  return `${label}-${Date.now()}-${counter}@powrfit.test`;
}

export const TEST_PASSWORD = "emulator-only-7Kq2";

/** Creates an account through the login page and waits for Home. */
export async function signUp(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/home$/);
}

/** Fills set `index` (0-based) of the exercise card named `exercise` and ticks it. */
export async function logSet(
  page: Page,
  exercise: string,
  index: number,
  weight: string,
  reps: string
): Promise<void> {
  const card = page.getByRole("region", { name: exercise });
  const n = index + 1;
  await card.getByLabel(new RegExp(`^Set ${n} weight`)).fill(weight);
  await card.getByLabel(`Set ${n} reps`).fill(reps);
  await card.getByRole("button", { name: `Set ${n} not done` }).click();
  await expect(card.getByRole("button", { name: `Set ${n} done` })).toBeVisible();
}

/** Puts the project's real rules (web/firestore.rules) back on the emulator. */
export async function restoreFirestoreRules(): Promise<void> {
  await setFirestoreRules(readFileSync("firestore.rules", "utf8"));
}

/** Opens the account menu from the mobile top bar or the desktop sidebar. */
export async function openAccountMenu(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) await page.getByRole("button", { name: "Open account menu" }).click();
  else await page.getByRole("button", { name: /@powrfit\.test/ }).click();
  await expect(page.getByRole("dialog", { name: "Account" })).toBeVisible();
}
