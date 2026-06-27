import { describe, expect, it } from "vitest";
import { coreFingerprint, diffGaps, type GapEntry } from "./manifest.js";

const gap = (over: Partial<GapEntry>): GapEntry => ({
  name: "X",
  missingBase: false,
  missingPoeladder: false,
  retired: false,
  ...over,
});

describe("coreFingerprint", () => {
  const base = {
    version: "3.28.0.14",
    itemCount: 100,
    uniqueCount: 50,
    gaps: [gap({ name: "A", missingBase: true })],
  };

  it("is stable regardless of gap ordering", () => {
    const a = coreFingerprint({
      ...base,
      gaps: [gap({ name: "A" }), gap({ name: "B" })],
    });
    const b = coreFingerprint({
      ...base,
      gaps: [gap({ name: "B" }), gap({ name: "A" })],
    });
    expect(a).toBe(b);
  });

  it("changes when a gap is filled", () => {
    const before = coreFingerprint(base);
    const after = coreFingerprint({
      ...base,
      gaps: [gap({ name: "A", missingBase: false })],
    });
    expect(before).not.toBe(after);
  });

  it("changes when the version bumps", () => {
    expect(coreFingerprint(base)).not.toBe(
      coreFingerprint({ ...base, version: "3.28.0.15" }),
    );
  });
});

describe("diffGaps", () => {
  it("reports bases filled since the previous run", () => {
    const prev = [gap({ name: "A", missingBase: true })];
    const next = [gap({ name: "A", missingBase: false })];
    expect(diffGaps(prev, next).filledBase).toEqual(["A"]);
  });

  it("reports newly appeared gaps", () => {
    const prev: GapEntry[] = [];
    const next = [gap({ name: "B", missingPoeladder: true })];
    const { newGaps } = diffGaps(prev, next);
    expect(newGaps.map((g) => g.name)).toEqual(["B"]);
  });

  it("is empty when nothing changed", () => {
    const same = [gap({ name: "A", missingBase: true })];
    expect(diffGaps(same, same)).toEqual({ filledBase: [], newGaps: [] });
  });
});
