import { expect, test } from "@playwright/test";

import {
  expectLabelledControls,
  expectNoSidewaysScroll,
  listDocuments,
  resetEmulators,
  signUp,
  testEmail,
} from "./helpers";

// P6-06: the gyms screen, against the test stand-in for OpenStreetMap
// (fake-provider.ts): Iron Den, Lift House and Corner Gym around any point.

const FIRESTORE = "http://127.0.0.1:8080/v1/projects/demo-powrfit/databases/(default)/documents";
const TESTVILLE = { latitude: 40.758, longitude: -73.9855 };

test.use({ geolocation: TESTVILLE, permissions: ["geolocation"] });

/** An approved price, written as the admin (P6-07 does this by hand). */
async function approvePrice(placeId: string, name: string, monthlyPrice: number) {
  const plan = {
    mapValue: {
      fields: {
        name: { stringValue: "Basic" },
        monthlyPrice: { integerValue: String(monthlyPrice) },
        currency: { stringValue: "USD" },
      },
    },
  };
  const response = await fetch(`${FIRESTORE}/gyms/${placeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({
      fields: {
        name: { stringValue: name },
        plans: { arrayValue: { values: [plan] } },
        source: { stringValue: "user report" },
        checkedAt: { stringValue: "2026-10-20" },
      },
    }),
  });
  expect(response.ok).toBe(true);
}

test.beforeEach(async () => {
  await resetEmulators();
  await approvePrice("osm-node-9001", "Iron Den", 45);
  await approvePrice("osm-node-9002", "Lift House", 20);
});

const gymNames = (page: import("@playwright/test").Page) =>
  page.getByRole("listitem").locator("p.truncate").allTextContents();

test("finds gyms, cheapest first, with a budget and price reports", async ({ page }) => {
  await signUp(page, testEmail("gyms"));
  await page.getByRole("link", { name: /Gyms near you/ }).click();
  await expect(page.getByRole("heading", { name: "Gyms near you" })).toBeVisible();

  // Near me sends a six-letter cell, never the position.
  const request = page.waitForRequest((req) => req.url().includes("/api/gyms"));
  await page.getByRole("button", { name: "Near me" }).click();
  // The first time, PowrFit says why before the system location prompt.
  await page.getByRole("dialog", { name: "Find gyms near you" }).getByRole("button", { name: "Continue" }).click();
  const url = new URL((await request).url());
  expect([...url.searchParams.keys()]).toEqual(["cell"]);
  expect(url.searchParams.get("cell")).toMatch(/^[0-9b-hjkmnp-z]{6}$/);
  await expect(page.getByRole("heading", { name: "Gyms near you", level: 2 })).toBeVisible();

  // A place search: known prices cheapest first, then the rest.
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Testville");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { name: "Gyms near Testville" })).toBeVisible();
  await expect.poll(() => gymNames(page)).toEqual(["Lift House", "Iron Den", "Corner Gym"]);
  await expect(page.getByText("$20/mo")).toBeVisible();
  await expect(page.getByText("No price yet")).toBeVisible();

  await page.getByRole("button", { name: "Nearest" }).click();
  await expect.poll(() => gymNames(page)).toEqual(["Corner Gym", "Iron Den", "Lift House"]);

  await page.getByRole("combobox", { name: "Budget" }).selectOption({ label: "Up to $25/mo" });
  await expect.poll(() => gymNames(page)).toEqual(["Corner Gym", "Lift House"]);
  await expect(page.getByText("1 gym costs more than your budget.")).toBeVisible();

  await expectNoSidewaysScroll(page, "Gyms");
  await expectLabelledControls(page, "Gyms");

  // Add a price: checked, then sent with its sender (only the admin can read it).
  await page.getByRole("button", { name: "Add a price for Corner Gym" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Send price" }).click();
  await expect(dialog.getByText("Name the plan, e.g. Basic or Unlimited.")).toBeVisible();
  await dialog.getByRole("textbox", { name: "Plan" }).fill("Unlimited");
  await dialog.getByRole("textbox", { name: "Per month" }).fill("29.99");
  await dialog.getByRole("button", { name: "Send price" }).click();
  await expect(page.getByText("Thanks! It shows once it's checked.")).toBeVisible();

  await expect.poll(async () => (await listDocuments("gymPriceReports")).length).toBe(1);
  const [report] = await listDocuments("gymPriceReports");
  expect(Object.keys(report.fields).sort()).toEqual(["createdAt", "currency", "gymName", "monthlyPrice", "placeId", "plan", "uid"]);
  expect(report.fields.placeId).toEqual({ stringValue: "osm-way-9003" });

  // Report a member's price (App Review 1.2): asks first, then only the admin can read it.
  await expect(page.getByRole("button", { name: "Report the price at Corner Gym" })).toHaveCount(0);
  await page.getByRole("button", { name: "Report the price at Lift House" }).click();
  await page.getByRole("dialog", { name: "Report this price?" }).getByRole("button", { name: "Report price" }).click();
  await expect(page.getByText("Reported. We'll check it.")).toBeVisible();
  await expect.poll(async () => (await listDocuments("priceFlags")).length).toBe(1);
  const [flag] = await listDocuments("priceFlags");
  expect(Object.keys(flag.fields).sort()).toEqual(["createdAt", "gymName", "placeId", "uid"]);
  expect(flag.fields.placeId).toEqual({ stringValue: "osm-node-9002" });

  // Coming back shows the last search without asking again.
  await page.getByRole("link", { name: "Home" }).first().click();
  await page.getByRole("link", { name: /Gyms near you/ }).click();
  await expect(page.getByRole("heading", { name: "Gyms near Testville" })).toBeVisible();
});

test("an unknown place says so", async ({ page }) => {
  await signUp(page, testEmail("gyms-none"));
  await page.goto("/gyms");
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Nowhere Land");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toHaveText("Couldn't find that place.");
});

test("with no prices yet, sorting and the budget are hidden", async ({ page }) => {
  await resetEmulators(); // drop the prices beforeEach approved
  await signUp(page, testEmail("gyms-noprice"));
  await page.goto("/gyms");
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Testville");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { name: "Gyms near Testville" })).toBeVisible();
  await expect(page.getByText("No prices here yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cheapest" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Budget" })).toHaveCount(0);
});

test("the admin approves a member's price, and everyone sees it", async ({ page }) => {
  await signUp(page, testEmail("gyms-admin"));
  await page.goto("/gyms");
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Testville");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("button", { name: "Add a price for Corner Gym" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Plan" }).fill("Unlimited");
  await dialog.getByRole("textbox", { name: "Per month" }).fill("12");
  await dialog.getByRole("button", { name: "Send price" }).click();
  await expect(page.getByText("Thanks! It shows once it's checked.")).toBeVisible();

  // Not the admin yet: no Review prices, and the screen says so.
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Review prices/ })).toHaveCount(0);
  await page.goto("/admin/prices");
  await expect(page.getByText("Only PowrFit's admin can review prices.")).toBeVisible();

  // Made the admin in the console (here: the emulator, as its owner).
  await expect.poll(async () => (await listDocuments("gymPriceReports")).length).toBe(1);
  const [report] = await listDocuments("gymPriceReports");
  const uid = (report.fields.uid as { stringValue: string }).stringValue;
  const made = await fetch(`${FIRESTORE}/admins/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: {} }),
  });
  expect(made.ok).toBe(true);

  await page.goto("/profile");
  await page.getByRole("link", { name: /Review prices/ }).click();
  await expect(page.getByText("Corner Gym")).toBeVisible();
  await expectLabelledControls(page, "Review prices");
  await page.getByRole("button", { name: "Approve Unlimited at Corner Gym" }).click();
  await expect(page.getByText("No prices to check.")).toBeVisible();
  expect(await listDocuments("gymPriceReports")).toHaveLength(0);

  // The approved price is now the cheapest in Testville.
  await page.goto("/gyms");
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Testville");
  await page.getByRole("button", { name: "Search" }).click();
  await expect.poll(() => gymNames(page)).toEqual(["Corner Gym", "Lift House", "Iron Den"]);
  await expect(page.getByText("$12/mo")).toBeVisible();

  // A member reports it; the admin takes it down after confirming.
  await page.getByRole("button", { name: "Report the price at Corner Gym" }).click();
  await page.getByRole("dialog", { name: "Report this price?" }).getByRole("button", { name: "Report price" }).click();
  await expect(page.getByText("Reported. We'll check it.")).toBeVisible();
  await expect.poll(async () => (await listDocuments("priceFlags")).length).toBe(1);
  await page.goto("/admin/prices");
  await expect(page.getByRole("heading", { name: "Reported prices" })).toBeVisible();
  await expectLabelledControls(page, "Reported prices");
  await page.getByRole("button", { name: "Take down the prices at Corner Gym" }).click();
  await page.getByRole("dialog", { name: "Take down these prices?" }).getByRole("button", { name: "Take down" }).click();
  await expect(page.getByRole("heading", { name: "Reported prices" })).toHaveCount(0);
  await expect.poll(async () => (await listDocuments("priceFlags")).length).toBe(0);
  await page.goto("/gyms");
  await page.getByRole("searchbox", { name: "City or zip code" }).fill("Testville");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("$12/mo")).toHaveCount(0);
});
