import { describe, expect, it, vi } from "vitest";

vi.mock("solid-js/store", () => ({
  createMutable: <T>(obj: T) => obj,
}));

vi.mock("./items", () => ({ itemIndex: { classes: [] } }));

import {
  BaseTypeCondition,
  ClassesCondition,
  RawBaseTypeCondition,
} from "./condition";

describe("BaseTypeCondition.serialize", () => {
  it("wraps plain values in quotes", () => {
    const cond = new BaseTypeCondition({ value: ["Vaal Regalia"] });
    expect(cond.serialize()).toBe('BaseType == "Vaal Regalia"');
  });

  it("joins multiple values with spaces", () => {
    const cond = new BaseTypeCondition({
      value: ["Vaal Regalia", "Astral Plate"],
    });
    expect(cond.serialize()).toBe('BaseType == "Vaal Regalia" "Astral Plate"');
  });

  it("returns empty string for empty values", () => {
    const cond = new BaseTypeCondition({ value: [] });
    expect(cond.serialize()).toBe("");
  });

  it("strips embedded quotes from values before wrapping", () => {
    const cond = new BaseTypeCondition({
      value: ['"O\' Eternal"', '"The Kiss Goodnight"'],
    });
    expect(cond.serialize()).toBe(
      'BaseType == "O\' Eternal" "The Kiss Goodnight"',
    );
  });

  it("handles mix of quoted and unquoted values", () => {
    const cond = new BaseTypeCondition({
      value: ["Vaal Regalia", '"O\' Eternal"'],
    });
    expect(cond.serialize()).toBe('BaseType == "Vaal Regalia" "O\' Eternal"');
  });
});

describe("RawBaseTypeCondition.serialize", () => {
  it("wraps plain values in quotes", () => {
    const cond = new RawBaseTypeCondition({ value: ["Flask"] });
    expect(cond.serialize()).toBe('BaseType "Flask"');
  });

  it("strips embedded quotes from values before wrapping", () => {
    const cond = new RawBaseTypeCondition({
      value: ['"The Nameless Play"'],
    });
    expect(cond.serialize()).toBe('BaseType "The Nameless Play"');
  });
});

describe("ClassesCondition.serialize", () => {
  it("strips embedded quotes from values before wrapping", () => {
    const cond = new ClassesCondition({ value: ['"Some Class"'] });
    expect(cond.serialize()).toBe('Class == "Some Class"');
  });
});
