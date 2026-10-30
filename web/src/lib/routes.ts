// Links to pages that show one saved item (P7-01). The id rides in the query
// string, not the path, so the same pages work in the static iOS build,
// which can't have a page per workout or routine id. The old path-style
// addresses still redirect here on the website.

export function workoutLogHref(logId: string): string {
  return `/workouts/history/view?id=${encodeURIComponent(logId)}`;
}

/** "new" opens an empty routine. */
export function routineHref(routineId: string): string {
  return `/workouts/routines/edit?id=${encodeURIComponent(routineId)}`;
}

export const NEW_ROUTINE_HREF = routineHref("new");

/**
 * Where the app's own server endpoints live. Empty on the website (same
 * origin); the iOS build sets NEXT_PUBLIC_API_ORIGIN to the Netlify site,
 * since a static export has no server of its own.
 */
export function apiUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_ORIGIN ?? ""}${path}`;
}
