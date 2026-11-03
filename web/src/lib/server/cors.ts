// CORS for PowrFit's own endpoints (P7-02). The iOS app runs at
// capacitor://localhost and calls them across origins; the website is
// same-origin and needs none. One fixed origin, so cached answers are the
// same for everyone and need no Vary.

export const APP_ORIGIN = "capacitor://localhost";

/** On every answer, so the app can read errors too. */
export const CORS_ORIGIN = { "Access-Control-Allow-Origin": APP_ORIGIN };

/** The app's preflight: the Authorization header makes it a non-simple request. */
export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
