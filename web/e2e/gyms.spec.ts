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

  // Add a price: checked, then sent anonymously.
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
  expect(Object.keys(report.fields).sort()).toEqual(["createdAt", "currency", "gymName", "monthlyPrice", "placeId", "plan"]);
  expect(report.fields.placeId).toEqual({ stringValue: "osm-way-9003" });

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
