import { describe, expect, it } from "vitest";
import { intervalHoursFor, shouldRun } from "./cadence.js";

describe("intervalHoursFor", () => {
  it("runs every tick within 48h of a core change", () => {
    expect(intervalHoursFor(0)).toBe(0);
    expect(intervalHoursFor(47)).toBe(0);
  });

  it("backs off to daily between 48h and 7d", () => {
    expect(intervalHoursFor(48)).toBe(24);
    expect(intervalHoursFor(167)).toBe(24);
  });

  it("backs off to every 3 days past 7d", () => {
    expect(intervalHoursFor(168)).toBe(72);
    expect(intervalHoursFor(1000)).toBe(72);
  });
});

describe("shouldRun", () => {
  it("always runs in the fresh-patch window", () => {
    expect(shouldRun({ hoursSinceChange: 1, hoursSinceCheck: 0 })).toBe(true);
  });

  it("skips when checked more recently than the tier interval", () => {
    expect(shouldRun({ hoursSinceChange: 72, hoursSinceCheck: 6 })).toBe(false);
  });

  it("runs once the tier interval has elapsed", () => {
    expect(shouldRun({ hoursSinceChange: 72, hoursSinceCheck: 24 })).toBe(true);
    expect(shouldRun({ hoursSinceChange: 200, hoursSinceCheck: 72 })).toBe(
      true,
    );
  });
});
