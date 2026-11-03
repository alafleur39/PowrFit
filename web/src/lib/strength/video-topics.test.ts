import { describe, expect, it } from "vitest";

import { EXERCISES, allVideoTopics, isVideoTopic, videoQuery } from "@/lib/strength";

describe("videoQuery", () => {
  it("knows the fixed topics", () => {
    expect(videoQuery("comeback")).toBe("how to get back into lifting after a break");
    expect(videoQuery("beginner")).toBe("beginner strength training program explained");
    expect(videoQuery("balance:push-pull")).toBe("balancing push and pull exercises for shoulder health");
  });

  it("builds plateau and form searches from the catalog name", () => {
    expect(videoQuery("plateau:barbell-bench-press")).toBe("how to break a barbell bench press plateau");
    expect(videoQuery("form:romanian-deadlift")).toBe("romanian deadlift proper form tutorial");
    expect(videoQuery("form:stair-climber")).toBe("stair climber proper form tutorial");
  });

  it.each([
    ["an unknown exercise", "form:zercher-squat"],
    ["a plateau on cardio", "plateau:stair-climber"],
    ["an unknown kind", "tips:barbell-bench-press"],
    ["extra parts", "form:barbell-bench-press:x"],
    ["a bare kind", "form"],
    ["free text", "how to bench 500"],
    ["an empty string", ""],
    ["an inherited property", "toString"],
    ["a prototype key", "__proto__"],
  ])("rejects %s", (_name, topic) => {
    expect(videoQuery(topic)).toBeNull();
    expect(isVideoTopic(topic)).toBe(false);
  });
});

describe("allVideoTopics", () => {
  const topics = allVideoTopics();

  it("lists every topic once, each with search words", () => {
    expect(new Set(topics).size).toBe(topics.length);
    for (const topic of topics) expect(videoQuery(topic), topic).not.toBeNull();
  });

  it("stays small enough to cache: 3 fixed, a plateau per strength exercise, a form per exercise", () => {
    const strength = EXERCISES.filter((exercise) => !exercise.cardio).length;
    expect(topics).toHaveLength(3 + strength + EXERCISES.length);
    expect(topics.length).toBeLessThan(300);
  });
});
