// Checks a Firebase sign-in token on the server (P6-05), so only PowrFit
// users can spend the gym provider's quota. Uses Web Crypto against
// Google's published keys, so no Admin SDK and no service-account secret.
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const KEYS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export type Jwk = JsonWebKey & { kid?: string };
export type KeySource = () => Promise<Jwk[]>;

let cachedKeys: { keys: Jwk[]; expires: number } | null = null;

/** Google's current signing keys, cached for as long as Google says. */
export const googleKeys: KeySource = async () => {
  if (cachedKeys && cachedKeys.expires > Date.now()) return cachedKeys.keys;
  const response = await fetch(KEYS_URL);
  if (!response.ok) throw new Error(`Couldn't fetch signing keys (${response.status})`);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  cachedKeys = { keys, expires: Date.now() + maxAge * 1000 };
  return keys;
};

function base64UrlDecode(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parsePart(part: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The user id in a valid token for `projectId`, or null. `emulator` accepts
 * the Auth emulator's unsigned tokens; callers only pass it outside
 * production.
 */
export async function verifyIdToken(
  token: string,
  options: { projectId: string; emulator?: boolean; keys?: KeySource; now?: number }
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = parsePart(headerPart);
  const payload = parsePart(payloadPart);
  if (!header || !payload) return null;

  const now = Math.floor((options.now ?? Date.now()) / 1000);
  const { projectId } = options;
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.sub !== "string" || payload.sub === "" || payload.sub.length > 128) return null;
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (typeof payload.iat !== "number" || payload.iat > now + 300) return null;

  if (options.emulator && header.alg === "none") return payload.sub;
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

  const jwk = (await (options.keys ?? googleKeys)()).find((key) => key.kid === header.kid);
  if (!jwk) return null;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlDecode(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
    return valid ? payload.sub : null;
  } catch {
    return null;
  }
}
