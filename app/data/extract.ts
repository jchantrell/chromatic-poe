import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { TABLES, getQuery } from "../frontend/lib/queries.js";
import { NodeBundleManager } from "./lib/bundle.js";
import { NodeDatabase } from "./lib/db.js";
import { NodeDatManager } from "./lib/dat.js";
import { extractMinimapCoords } from "./lib/minimap.js";
import { extractMods } from "./lib/mods.js";
import { notifyFailure, notifySuccess } from "./lib/notify.js";
import { fetchAllUniques } from "./lib/poeladder.js";
import { fetchPoeVersions } from "./lib/versions.js";
import { queryWiki } from "./lib/wiki.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");

interface UniqueOutput {
  name: string;
  base: string | null;
  category: string;
  class: string | null;
  type: string | null;
  score: number;
  art: string | null;
  height: number | null;
  width: number | null;
  itemClass: string | null;
  gemFx: string | null;
  dropEnabledStandard: boolean;
  dropEnabledLeague: boolean;
  poeladder: {
    grouping: string;
    category: string;
    tier: number | null;
    league: string | null;
  } | null;
}

function writeOutput(filename: string, data: unknown): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const path = resolve(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data));
  console.log(`Wrote ${path}`);
}

async function extractPatchData(
  patch: string,
  game: string,
): Promise<{ db: NodeDatabase; itemCount: number }> {
  console.log(`\n=== Patch data pipeline: ${game} ${patch} ===\n`);

  const db = new NodeDatabase();
  const loader = new NodeBundleManager();
  const dat = new NodeDatManager(db, loader);

  await loader.init(patch);
  await dat.importAllTables(patch, TABLES);

  const items = db.query(getQuery(patch, "items"));
  console.log(`Queried ${items.length} items`);
  writeOutput("items.json", items);

  const minimapIcons = db.query(getQuery(patch, "minimap")) as unknown as {
    Id: string;
  }[];
  const minimapCoords = extractMinimapCoords(minimapIcons);
  writeOutput("minimap.json", minimapCoords);

  const mods = await extractMods(patch, db, loader);
  writeOutput("mods.json", mods);

  return { db, itemCount: items.length };
}

async function extractUniqueData(
  patch: string,
  game: string,
  db: NodeDatabase,
): Promise<{
  uniques: UniqueOutput[];
  gaps: { name: string; missingBase: boolean; missingPoeladder: boolean }[];
}> {
  console.log(`\n=== Unique data pipeline: ${game} ${patch} ===\n`);

  const rawUniques = db.query(getQuery(patch, "uniques")) as Record<
    string,
    unknown
  >[];
  console.log(`Found ${rawUniques.length} uniques from game data`);

  let wikiUniques: { name: string; base: string }[] = [];
  try {
    wikiUniques = await queryWiki(patch);
  } catch (err) {
    console.warn("Wiki query failed:", err);
  }
  const wikiMap = new Map(wikiUniques.map((u) => [u.name, u.base]));

  let poeladderUniques: {
    name: string;
    grouping: string;
    category: string;
    league: string | null;
  }[] = [];
  const slugEnv =
    game === "poe2"
      ? "POELADDER_LEAGUE_SLUG_POE2"
      : "POELADDER_LEAGUE_SLUG_POE1";
  const leagueSlug = process.env[slugEnv] ?? process.env.POELADDER_LEAGUE_SLUG;
  if (leagueSlug) {
    try {
      poeladderUniques = await fetchAllUniques(leagueSlug);
    } catch (err) {
      console.warn("Poeladder query failed:", err);
    }
  } else {
    console.warn(`${slugEnv} not set, skipping poeladder enrichment`);
  }
  const ladderMap = new Map(
    poeladderUniques.map((u) => [
      u.name,
      {
        grouping: u.grouping,
        category: u.category,
        tier: u.tier,
        league: u.league,
      },
    ]),
  );

  const gaps: {
    name: string;
    missingBase: boolean;
    missingPoeladder: boolean;
    retired: boolean;
  }[] = [];

  const uniques: UniqueOutput[] = rawUniques.map((u) => {
    const name = u.name as string;
    const base = wikiMap.get(name) ?? null;
    const ladder = ladderMap.get(name) ?? null;
    const dropStandard = Boolean(u.dropEnabledStandard);
    const dropLeague = Boolean(u.dropEnabledLeague);
    const retired = !dropStandard && !dropLeague;

    if (!base || !ladder) {
      gaps.push({
        name,
        missingBase: !base,
        missingPoeladder: !ladder,
        retired,
      });
    }

    return {
      name,
      base,
      category: retired ? "Unknown" : ((u.category as string) ?? "Uniques"),
      class: (u.class as string) ?? null,
      type: (u.type as string) ?? null,
      score: (u.score as number) ?? 0,
      art: (u.art as string) ?? null,
      height: (u.height as number) ?? null,
      width: (u.width as number) ?? null,
      itemClass: (u.itemClass as string) ?? null,
      gemFx: (u.gemFx as string) ?? null,
      dropEnabledStandard: dropStandard,
      dropEnabledLeague: dropLeague,
      poeladder: ladder,
    };
  });

  writeOutput("uniques.json", uniques);

  if (gaps.length) {
    console.log(`\nGaps: ${gaps.length} uniques with missing data`);
    for (const gap of gaps) {
      const issues = [];
      if (gap.missingBase) issues.push("unknown base type");
      if (gap.missingPoeladder) issues.push("unknown poeladder category");
      console.log(`  - ${gap.name}: ${issues.join(", ")}`);
    }
  } else {
    console.log("\nAll uniques fully enriched.");
  }

  return { uniques, gaps };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      game: { type: "string", default: "both" },
      force: { type: "boolean", default: false },
      "uniques-only": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const gameFilter = values.game ?? "both";
  const uniquesOnly = values["uniques-only"] ?? false;

  const versions = await fetchPoeVersions();
  console.log(
    `Current versions — PoE1: ${versions.poe1}, PoE2: ${versions.poe2}`,
  );

  const targets: { game: string; patch: string }[] = [];
  if (gameFilter === "poe1" || gameFilter === "both") {
    targets.push({ game: "poe1", patch: versions.poe1 });
  }
  if (gameFilter === "poe2" || gameFilter === "both") {
    targets.push({ game: "poe2", patch: versions.poe2 });
  }

  for (const { game, patch } of targets) {
    try {
      let db: NodeDatabase;
      let itemCount: number;

      if (uniquesOnly) {
        db = new NodeDatabase();
        const loader = new NodeBundleManager();
        const dat = new NodeDatManager(db, loader);
        await loader.init(patch);
        await dat.importAllTables(patch, TABLES);
        itemCount = 0;
      } else {
        const result = await extractPatchData(patch, game);
        db = result.db;
        itemCount = result.itemCount;
      }

      const { uniques, gaps } = await extractUniqueData(patch, game, db);
      db.close();

      await notifySuccess(game, patch, itemCount, uniques.length, gaps);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Pipeline failed for ${game} ${patch}:`, err);
      await notifyFailure(game, patch, message);
      process.exit(1);
    }
  }
}

main();
