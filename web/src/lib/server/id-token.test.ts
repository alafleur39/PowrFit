import { beforeAll, describe, expect, it } from "vitest";

import { verifyIdToken, type Jwk } from "./id-token";

const PROJECT = "powrfit-test";
const NOW = Date.UTC(2026, 9, 19, 18);
const seconds = Math.floor(NOW / 1000);

const b64url = (bytes: Uint8Array | string) =>
  Buffer.from(typeof bytes === "string" ? bytes : bytes).toString("base64url");

let pair: CryptoKeyPair;
let publicJwk: Jwk;

beforeAll(async () => {
  pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  publicJwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
});

const claims = (overrides: Record<string, unknown> = {}) => ({
  aud: PROJECT,
  iss: `https://securetoken.google.com/${PROJECT}`,
  sub: "alice",
  iat: seconds - 60,
  exp: seconds + 3600,
  ...overrides,
});

async function sign(payload: object, header: object = { alg: "RS256", kid: "k1" }) {
  const head = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(head));
  return `${head}.${b64url(new Uint8Array(signature))}`;
}

const verify = (token: string, emulator = false) =>
  verifyIdToken(token, { projectId: PROJECT, emulator, keys: async () => [publicJwk], now: NOW });

describe("verifyIdToken", () => {
  it("accepts a correctly signed token and returns the user id", async () => {
    expect(await verify(await sign(claims()))).toBe("alice");
  });

  it.each([
    ["another project", { aud: "other" }],
    ["another issuer", { iss: "https://evil.example" }],
    ["an expired token", { exp: seconds - 1 }],
    ["a token from the future", { iat: seconds + 3600 }],
    ["no user", { sub: "" }],
  ])("rejects %s", async (_name, overrides) => {
    expect(await verify(await sign(claims(overrides)))).toBeNull();
  });

  it("rejects a tampered payload, an unknown key and garbage", async () => {
    const token = await sign(claims());
    const [head, , signature] = token.split(".");
    expect(await verify(`${head}.${b64url(JSON.stringify(claims({ sub: "mallory" })))}.${signature}`)).toBeNull();
    expect(await verify(await sign(claims(), { alg: "RS256", kid: "k2" }))).toBeNull();
    expect(await verify("not.a.token")).toBeNull();
    expect(await verify("")).toBeNull();
  });

  it("accepts unsigned emulator tokens only in emulator mode", async () => {
    const unsigned = `${b64url(JSON.stringify({ alg: "none" }))}.${b64url(JSON.stringify(claims()))}.`;
    expect(await verify(unsigned, true)).toBe("alice");
    expect(await verify(unsigned, false)).toBeNull();
  });
});
