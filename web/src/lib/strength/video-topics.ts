// Video topics and their search words (YouTube stage 3, V-01).
//
// The one list of topics a suggestion can have, shared by the phone (the
// "For you" card's search link) and the server (/api/videos, V-02). The
// server only accepts a topic from this list and builds the search words
// itself, so nobody can make PowrFit run arbitrary YouTube searches or fill
// the CDN cache with junk, and the number of cached answers stays bounded.
//
//   comeback · beginner · balance:push-pull
//   plateau:<exerciseId>   strength exercises only (cardio has no top set)
//   form:<exerciseId>      every exercise

import { EXERCISES } from "./exercises";

const FIXED: Readonly<Record<string, string>> = {
  comeback: "how to get back into lifting after a break",
  "balance:push-pull": "balancing push and pull exercises for shoulder health",
  beginner: "beginner strength training program explained",
};

const EXERCISE_NAMES = new Map(EXERCISES.map((exercise) => [exercise.id, exercise.name]));
const STRENGTH_IDS = new Set(EXERCISES.filter((exercise) => !exercise.cardio).map((exercise) => exercise.id));

const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

/** The YouTube search words for a topic, or null when it isn't a known topic. */
export function videoQuery(topic: string): string | null {
  if (Object.hasOwn(FIXED, topic)) return FIXED[topic];
  const [kind, exerciseId, ...rest] = topic.split(":");
  if (rest.length > 0 || exerciseId === undefined) return null;
  const name = EXERCISE_NAMES.get(exerciseId);
  if (!name) return null;
  if (kind === "plateau" && STRENGTH_IDS.has(exerciseId)) return `how to break a ${lower(name)} plateau`;
  if (kind === "form") return `${lower(name)} proper form tutorial`;
  return null;
}

export function isVideoTopic(topic: string): boolean {
  return videoQuery(topic) !== null;
}

/** Every topic, for tests and for sizing the cache: about 260 today. */
export function allVideoTopics(): string[] {
  return [
    ...Object.keys(FIXED),
    ...EXERCISES.filter((exercise) => !exercise.cardio).map((exercise) => `plateau:${exercise.id}`),
    ...EXERCISES.map((exercise) => `form:${exercise.id}`),
  ];
}
