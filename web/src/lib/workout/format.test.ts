import { describe, expect, it } from "vitest";

import {
  formatCardioMinutes,
  formatCardioSet,
  formatCardioTime,
  formatDuration,
  formatElapsed,
  formatSetsLine,
  formatWeight,
  formatWeightAmount,
  plural,
  parseDecimalInput,
  parseDurationInput,
  parseRepsInput,
  parseWeightInput,
  weekStart,
} from "./format";

const START = "2026-10-16T17:00:00.000Z";
const at = (seconds: number) => Date.parse(START) + seconds * 1000;

describe("formatElapsed", () => {
  it.each([
    [0, "0:00"],
    [65, "1:05"],
    [754, "12:34"],
    [3723, "1:02:03"],
    [-5, "0:00"],
  ])("%d s → %s", (seconds, expected) => {
    expect(formatElapsed(START, at(seconds))).toBe(expected);
  });
});

describe("formatDuration", () => {
  it.each([
    ["2026-10-16T17:36:00.000Z", "36 min"],
    ["2026-10-16T18:00:00.000Z", "1 h"],
    ["2026-10-16T18:05:00.000Z", "1 h 5 min"],
  ])("to %s → %s", (end, expected) => {
    expect(formatDuration(START, end)).toBe(expected);
  });
});

describe("formatWeight", () => {
  it("rounds to the step and groups thousands", () => {
    expect(formatWeight(135, "lb")).toBe("135 lb");
    expect(formatWeight(62.5, "kg")).toBe("62.5 kg");
    expect(formatWeight(3824.62, "lb")).toBe("3,824.6 lb");
  });
});

describe("formatSetsLine", () => {
  it("lists sets as weight × reps in the display unit", () => {
    const sets = [
      { reps: 6, weight: 135, unit: "lb" as const, done: true },
      { reps: 5, weight: 60, unit: "kg" as const, done: true },
    ];
    expect(formatSetsLine(sets, "lb")).toBe("135 × 6, 132.3 × 5");
    expect(formatSetsLine(sets, "kg")).toBe("61.2 × 6, 60 × 5");
  });
});

describe("parseWeightInput", () => {
  it.each([
    ["", null],
    ["  ", null],
    ["135", 135],
    ["62.5", 62.5],
    ["62,5", 62.5],
    [".5", 0.5],
    ["0", 0],
  ])("%j → %j", (text, expected) => {
    expect(parseWeightInput(text)).toBe(expected);
  });

  it.each(["-5", "abc", "1e3", "5000", "1.2.3"])("rejects %j", (text) => {
    expect(parseWeightInput(text)).toBeUndefined();
  });
});

describe("parseRepsInput", () => {
  it.each([
    ["", null],
    ["8", 8],
    ["0", 0],
  ])("%j → %j", (text, expected) => {
    expect(parseRepsInput(text)).toBe(expected);
  });

  it.each(["2.5", "-1", "x", "5000"])("rejects %j", (text) => {
    expect(parseRepsInput(text)).toBeUndefined();
  });
});

describe("weekStart", () => {
  it("returns Monday 00:00 local time", () => {
    const friday = new Date(2026, 9, 16, 15, 30);
    expect(weekStart(friday)).toEqual(new Date(2026, 9, 12));
    const monday = new Date(2026, 9, 12, 0, 1);
    expect(weekStart(monday)).toEqual(new Date(2026, 9, 12));
    const sunday = new Date(2026, 9, 18, 23, 59);
    expect(weekStart(sunday)).toEqual(new Date(2026, 9, 12));
  });
});

describe("plural", () => {
  it("says 1 set and 2 sets", () => {
    expect(plural(1, "set")).toBe("1 set");
    expect(plural(0, "set")).toBe("0 sets");
    expect(plural(2, "exercise")).toBe("2 exercises");
    expect(plural(3, "person", "people")).toBe("3 people");
  });
});

describe("formatWeightAmount", () => {
  it("is formatWeight without the unit", () => {
    expect(formatWeightAmount(1140, "lb")).toBe("1,140");
    expect(formatWeight(1140, "lb")).toBe("1,140 lb");
  });
});

describe("cardio", () => {
  it("formats times and totals", () => {
    expect(formatCardioTime(1200)).toBe("20:00");
    expect(formatCardioTime(2730)).toBe("45:30");
    expect(formatCardioTime(3900)).toBe("1:05:00");
    expect(formatCardioMinutes(1530)).toBe("26 min");
    expect(formatCardioMinutes(3900)).toBe("1 h 5 min");
  });

  it("formats a cardio set, leaving out what wasn't entered", () => {
    expect(formatCardioSet({ durationSec: 1200, level: 8, floors: 95, calories: 210, done: true })).toBe(
      "20:00 · level 8 · 95 floors · 210 cal"
    );
    expect(
      formatCardioSet({ durationSec: 900, distance: 1.5, distanceUnit: "mi", inclinePct: 3, done: true })
    ).toBe("15:00 · 1.5 mi · 3% incline");
    expect(formatSetsLine([{ durationSec: 600, floors: 1, done: true }], "lb")).toBe("10:00 · 1 floor");
  });

  it("parses minutes, m:ss and h:mm:ss", () => {
    expect(parseDurationInput("")).toBeNull();
    expect(parseDurationInput("20")).toBe(1200);
    expect(parseDurationInput("12.5")).toBe(750);
    expect(parseDurationInput("20:30")).toBe(1230);
    expect(parseDurationInput("1:05:00")).toBe(3900);
    expect(parseDurationInput("0")).toBeUndefined();
    expect(parseDurationInput("20:75")).toBeUndefined();
    expect(parseDurationInput("abc")).toBeUndefined();
    expect(parseDurationInput("25:00:00")).toBeUndefined();
  });

  it("parses optional decimal stats up to a limit", () => {
    expect(parseDecimalInput("", 40)).toBeNull();
    expect(parseDecimalInput("3,5", 40)).toBe(3.5);
    expect(parseDecimalInput("41", 40)).toBeUndefined();
  });
});
