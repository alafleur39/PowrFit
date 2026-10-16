import { describe, expect, it } from "vitest";

import {
  KG_PER_LB,
  convertWeight,
  roundWeight,
  type WeightUnit,
} from "@/lib/strength";

describe("convertWeight", () => {
  it("uses the exact pound definition", () => {
    expect(KG_PER_LB).toBe(0.45359237);
    expect(convertWeight(1, "lb", "kg")).toBe(0.45359237);
  });

  it.each([
    [100, "kg", "lb", 220.5],
    [45, "lb", "kg", 20.4],
    [20, "kg", "lb", 44.1],
    [135, "lb", "kg", 61.2],
    [0, "kg", "lb", 0],
  ] as const)("%d %s → %d %s after rounding", (value, from, to, expected) => {
    expect(roundWeight(convertWeight(value, from, to), to)).toBe(expected);
  });

  it("returns the value unchanged for the same unit", () => {
    expect(convertWeight(102.37, "kg", "kg")).toBe(102.37);
    expect(convertWeight(225, "lb", "lb")).toBe(225);
  });

  it("round-trips kg → lb → kg within one rounding step", () => {
    for (let tenths = 0; tenths <= 5000; tenths++) {
      const kg = tenths / 10;
      const lb = roundWeight(convertWeight(kg, "kg", "lb"), "lb");
      const back = roundWeight(convertWeight(lb, "lb", "kg"), "kg");
      expect(Math.abs(back - kg)).toBeLessThanOrEqual(0.1);
    }
  });
});

describe("roundWeight", () => {
  it.each([
    [220.46, 220.5],
    [220.44, 220.4],
    [0.04, 0],
    [0.05, 0.1],
    [99.99, 100],
  ])("rounds %d to %d", (value, expected) => {
    expect(roundWeight(value, "kg")).toBe(expected);
    expect(roundWeight(value, "lb")).toBe(expected);
  });

  it("leaves no floating-point noise", () => {
    expect(roundWeight(220.5, "lb")).toBe(220.5);
    expect(String(roundWeight(0.3, "kg"))).toBe("0.3");
  });
});

describe("invalid input", () => {
  const units: WeightUnit[] = ["kg", "lb"];

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "throws a RangeError for %d",
    (value) => {
      for (const unit of units) {
        expect(() => roundWeight(value, unit)).toThrow(RangeError);
        expect(() => convertWeight(value, unit, unit)).toThrow(RangeError);
        expect(() => convertWeight(value, "kg", "lb")).toThrow(RangeError);
      }
    }
  );
});
