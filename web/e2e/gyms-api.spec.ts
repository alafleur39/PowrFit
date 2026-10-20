import { expect, test } from "@playwright/test";

import { TEST_PASSWORD, resetEmulators, testEmail } from "./helpers";

// P6-05: GET /api/gyms. Input is checked, only signed-in users get through,
// and answers can be cached per cell. The provider is the test stand-in.

const AUTH = "http://127.0.0.1:9099";

test.beforeEach(async () => {
  await resetEmulators();
});

/** A real sign-in token from the Auth emulator. */
async function idToken(): Promise<string> {
  const response = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail("gyms-api"), password: TEST_PASSWORD, returnSecureToken: true }),
  });
  return ((await response.json()) as { idToken: string }).idToken;
}

test("checks input, requires sign-in, and returns cacheable gyms", async ({ request, isMobile }) => {
  test.skip(isMobile, "an API test; one browser is enough");
  const auth = { Authorization: `Bearer ${await idToken()}` };

  expect((await request.get("/api/gyms?cell=bad", { headers: auth })).status()).toBe(400);
  expect((await request.get("/api/gyms?place=x", { headers: auth })).status()).toBe(400);
  expect((await request.get("/api/gyms", { headers: auth })).status()).toBe(400);

  expect((await request.get("/api/gyms?cell=dr5ru7")).status()).toBe(401);
  expect((await request.get("/api/gyms?cell=dr5ru7", { headers: { Authorization: "Bearer a.b.c" } })).status()).toBe(401);

  const byCell = await request.get("/api/gyms?cell=dr5ru7", { headers: auth });
  expect(byCell.status()).toBe(200);
  expect(byCell.headers()["cache-control"]).toBe("public, max-age=3600");
  const body = (await byCell.json()) as { cell: string; gyms: { placeId: string }[] };
  expect(body.cell).toBe("dr5ru7");
  expect(body.gyms.map((gym) => gym.placeId)).toEqual(["osm-node-9001", "osm-node-9002", "osm-way-9003"]);

  const byPlace = await request.get("/api/gyms?place=Testville", { headers: auth });
  expect(((await byPlace.json()) as { cell: string }).cell).toBe("dr5ru7");
  expect((await request.get("/api/gyms?place=Nowhere%20Land", { headers: auth })).status()).toBe(404);
});
