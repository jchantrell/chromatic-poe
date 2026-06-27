import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface GapEntry {
  name: string;
  missingBase: boolean;
  missingPoeladder: boolean;
  retired: boolean;
}

export interface Manifest {
  version: string;
  coreHash: string;
  contentHash: string;
  itemCount: number;
  uniqueCount: number;
  gaps: GapEntry[];
  coreChangedAt: string;
  checkedAt: string;
}

const DEFAULT_REPO = "jchantrell/chromatic-poe";
const CONTENT_FILES = [
  "items.json",
  "minimap.json",
  "mods.json",
  "unmapped.json",
  "uniques.json",
];

export function contentHash(outputDir: string): string {
  const hash = createHash("sha256");
  for (const file of CONTENT_FILES) {
    hash.update(file);
    hash.update(readFileSync(resolve(outputDir, file)));
  }
  return hash.digest("hex");
}

export function coreFingerprint(input: {
  version: string;
  itemCount: number;
  uniqueCount: number;
  gaps: GapEntry[];
}): string {
  const gaps = [...input.gaps].sort((a, b) => a.name.localeCompare(b.name));
  const payload = JSON.stringify({
    v: input.version,
    i: input.itemCount,
    u: input.uniqueCount,
    gaps,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export interface GapDiff {
  filledBase: string[];
  newGaps: GapEntry[];
}

export function diffGaps(prev: GapEntry[], next: GapEntry[]): GapDiff {
  const prevByName = new Map(prev.map((g) => [g.name, g]));
  const nextByName = new Map(next.map((g) => [g.name, g]));

  const filledBase = prev
    .filter((g) => g.missingBase)
    .filter((g) => !nextByName.get(g.name)?.missingBase)
    .map((g) => g.name)
    .sort();

  const newGaps = next
    .filter((g) => !prevByName.has(g.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { filledBase, newGaps };
}

export async function loadPreviousManifest(
  game: string,
  version: string,
  repo: string = process.env.GITHUB_REPOSITORY ?? DEFAULT_REPO,
): Promise<Manifest | null> {
  const url = `https://github.com/${repo}/releases/download/data-${game}-${version}/manifest.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as Manifest;
  } catch {
    return null;
  }
}

export function writeManifest(outputDir: string, manifest: Manifest): void {
  writeFileSync(
    resolve(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}
