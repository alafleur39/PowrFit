import { expect, test } from "@playwright/test";

import { expectLabelledControls, expectNoSidewaysScroll, resetEmulators, signUp, testEmail } from "./helpers";

// P5-04: "Forgot password?" on the login page (D29), end to end against the
// Auth emulator, which keeps reset emails as codes instead of sending them.

const AUTH = "http://127.0.0.1:9099";
const PROJECT = "demo-powrfit";
const NEW_PASSWORD = "emulator-only-new-9Xw4";

test.beforeEach(async () => {
  await resetEmulators();
});

async function resetCodeFor(email: string): Promise<string | undefined> {
  const response = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = (await response.json()) as {
    oobCodes: { email: string; requestType: string; oobCode: string }[];
  };
  return oobCodes.find((code) => code.email === email && code.requestType === "PASSWORD_RESET")?.oobCode;
}

test("a forgotten password can be reset from the login page", async ({ page, browser }) => {
  const email = testEmail("reset");
  await signUp(page, email);

  // A signed-out device.
  const context = await browser.newContext({ ...test.info().project.use });
  const login = await context.newPage();
  await login.goto("/login");
  await expectNoSidewaysScroll(login, "Login");
  await expectLabelledControls(login, "Login");

  await login.getByRole("button", { name: "Forgot password?" }).click();
  await expect(login.getByText("Enter your email address above, then tap Forgot password.")).toBeVisible();

  // Unknown and known emails get the same answer.
  await login.getByLabel("Email address").fill(testEmail("nobody"));
  await login.getByRole("button", { name: "Forgot password?" }).click();
  await expect(login.getByRole("status")).toContainText("If there's an account for nobody-");

  await login.getByLabel("Email address").fill(email);
  await login.getByRole("button", { name: "Forgot password?" }).click();
  await expect(login.getByRole("status")).toContainText(`If there's an account for ${email}`);

  // Follow the emailed link the way Firebase's reset page would.
  await expect.poll(() => resetCodeFor(email)).toBeTruthy();
  const oobCode = await resetCodeFor(email);
  const reset = await fetch(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oobCode, newPassword: NEW_PASSWORD }),
    }
  );
  expect(reset.ok).toBe(true);

  await login.getByLabel("Password").fill(NEW_PASSWORD);
  await login.getByRole("button", { name: /^sign in$/i }).click();
  await expect(login.getByRole("heading", { name: "Home" })).toBeVisible({ timeout: 15_000 });
  await context.close();
});
