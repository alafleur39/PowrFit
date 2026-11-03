import { expect, test } from "@playwright/test";

import { TEST_PASSWORD, resetEmulators, testEmail } from "./helpers";

// V-02: GET /api/videos. Only known topics, only signed-in users, cached per
// topic, readable by the iOS app. The provider is the test stand-in.

const AUTH = "http://127.0.0.1:9099";

test.beforeEach(async () => {
  await resetEmulators();
});

async function idToken(): Promise<string> {
  const response = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail("videos-api"), password: TEST_PASSWORD, returnSecureToken: true }),
  });
  return ((await response.json()) as { idToken: string }).idToken;
}

test("accepts only known topics from signed-in users and caches answers per topic", async ({ request, isMobile }) => {
  test.skip(isMobile, "an API test; one browser is enough");
  const auth = { Authorization: `Bearer ${await idToken()}` };

  for (const topic of ["", "how to bench 500", "plateau:stair-climber", "form:zercher-squat"]) {
    expect((await request.get(`/api/videos?topic=${encodeURIComponent(topic)}`, { headers: auth })).status(), topic).toBe(400);
  }
  expect((await request.get("/api/videos?topic=beginner")).status()).toBe(401);
  expect((await request.get("/api/videos?topic=beginner", { headers: { Authorization: "Bearer a.b.c" } })).status()).toBe(401);

  const answer = await request.get("/api/videos?topic=plateau:barbell-bench-press", { headers: auth });
  expect(answer.status()).toBe(200);
  expect(answer.headers()["cache-control"]).toBe("public, max-age=86400");
  expect(answer.headers()["netlify-cdn-cache-control"]).toBe("public, s-maxage=604800, stale-while-revalidate=86400");
  expect(answer.headers()["netlify-vary"]).toBe("query=topic");
  const body = (await answer.json()) as { topic: string; source: string; videos: { videoId: string; title: string }[] };
  expect(body.topic).toBe("plateau:barbell-bench-press");
  expect(body.source).toBe("youtube");
  expect(body.videos).toHaveLength(3);
  // The server built the search words from the topic.
  expect(body.videos[0].title).toBe("how to break a barbell bench press plateau (1)");
});

test("lets the iOS app call it across origins", async ({ request, isMobile }) => {
  test.skip(isMobile, "an API test; one browser is enough");
  const app = "capacitor://localhost";
  const preflight = await request.fetch("/api/videos?topic=beginner", {
    method: "OPTIONS",
    headers: { Origin: app, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" },
  });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()["access-control-allow-origin"]).toBe(app);

  const answer = await request.get("/api/videos?topic=beginner", {
    headers: { Origin: app, Authorization: `Bearer ${await idToken()}` },
  });
  expect(answer.status()).toBe(200);
  expect(answer.headers()["access-control-allow-origin"]).toBe(app);
});
