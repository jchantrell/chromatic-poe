export type Game = "poe1" | "poe2";

const PATCH_PATTERN = /^\d+(\.\d+){1,4}$/;

export function isValidPatch(value: unknown): value is string {
  return typeof value === "string" && PATCH_PATTERN.test(value);
}

// PoE1 ships 3.x. PoE2 shipped 4.x until 0.5, when GGG switched it to 0.x.
export function gameFromPatch(patch: string): Game {
  return patch.startsWith("3.") ? "poe1" : "poe2";
}

export function isPoE2(patch: string): boolean {
  return gameFromPatch(patch) === "poe2";
}

function normalisePatch(patch: string): number[] {
  const parts = patch.split(".").map((p) => Number.parseInt(p, 10) || 0);
  if (isPoE2(patch) && parts[0] === 4) return [0, ...parts.slice(1)];
  return parts;
}

export function comparePatches(a: string, b: string): number {
  const pa = normalisePatch(a);
  const pb = normalisePatch(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
