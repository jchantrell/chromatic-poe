import { describe, expect, it } from "vitest";
import { comparePatches, gameFromPatch, isValidPatch } from "./patch";

describe("gameFromPatch", () => {
  it.each([
    ["3.29.3.3", "poe1"],
    ["3.25", "poe1"],
    ["4.4.0.3", "poe2"],
    ["0.5.5.4.2", "poe2"],
  ])("%s -> %s", (patch, game) => {
    expect(gameFromPatch(patch)).toBe(game);
  });
});

describe("isValidPatch", () => {
  it.each(["3.29.3.3", "0.5.5.4.2", "4.0.0", "3.25"])("accepts %s", (v) => {
    expect(isValidPatch(v)).toBe(true);
  });

  it.each(["error", "", "3", "3.x", undefined, null, 4])("rejects %s", (v) => {
    expect(isValidPatch(v)).toBe(false);
  });
});

describe("comparePatches", () => {
  it("orders within a scheme", () => {
    expect(comparePatches("3.29.3.3", "3.29.3.2")).toBeGreaterThan(0);
    expect(comparePatches("0.5.5.4.1", "0.5.5.4.2")).toBeLessThan(0);
  });

  it("orders legacy PoE2 4.x before 0.5+", () => {
    expect(comparePatches("0.5.5.4.2", "4.4.0.3")).toBeGreaterThan(0);
    expect(comparePatches("4.4.0.3", "0.5.0")).toBeLessThan(0);
  });

  it("treats 4.N as equivalent to 0.N", () => {
    expect(comparePatches("4.4.0", "0.4.0")).toBe(0);
  });
});
