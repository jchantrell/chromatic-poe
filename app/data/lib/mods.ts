import {
  parseStatDescriptionFile,
  formatStatDescription,
  type StatDescriptionEntry,
} from "../../frontend/lib/stat-descriptions.js";
import type { NodeBundleManager } from "./bundle.js";
import type { NodeDatabase } from "./db.js";

enum GenType {
  UNUSED_0,
  PREFIX,
  SUFFIX,
  UNIQUE,
  NEMESIS,
  CORRUPTED,
  BLOODLINES,
  TORMENT,
  TEMPEST,
  TALISMAN,
  ENCHANTMENT,
  ESSENCE,
  UNUSED_1,
  BESTIARY,
  DELVE_AREA,
  SYNTHESIS_A,
  SYNTHESIS_GLOBALS,
  SYNTHESIS_BONUS,
  BLIGHT,
  BLIGHT_TOWER,
  MONSTER_AFFLICTION,
  FLASK_ENCHANTMENT_ENKINDLING,
  FLASK_ENCHANTMENT_INSTILLING,
  EXPEDITION_LOGBOOK,
  SCOURGE_UPSIDE,
  SCOURGE_DOWNSIDE,
  SCOURGE_MAP,
  UNUSED_2,
  EXARCH_IMPLICIT,
  EATER_IMPLICIT,
  UNUSED_3,
  WEAPON_TREE,
  WEAPON_TREE_RECOMBINED,
  UNUSED_4,
  NECROPOLIS_HAUNTED,
  NECROPOLIS_DEVOTED,
}

const MODIFIABLE_CLASSES = [
  "Life Flasks",
  "Mana Flasks",
  "Hybrid Flasks",
  "Utility Flasks",
  "Tinctures",
  "Charms",
  "Waystones",
  "Maps",
  "Amulets",
  "Rings",
  "Belts",
  "Jewels",
  "Abyss Jewels",
  "Boots",
  "Body Armours",
  "Helmets",
  "Gloves",
  "Fishing Rods",
  "Claws",
  "Daggers",
  "Wands",
  "Staves",
  "Quarterstaves",
  "Scepters",
  "Wands",
  "Scepters",
  "Bows",
  "Quivers",
  "Spears",
  "Crossbows",
  "Foci",
  "Flails",
  "Bucklers",
  "Traps",
  "One Hand Axes",
  "One Hand Maces",
  "One Hand Swords",
  "Thrusting One Hand Swords",
  "Two Hand Axes",
  "Two Hand Maces",
  "Two Hand Swords",
  "Blueprints",
  "Contracts",
  "Trinkets",
  "Heist Brooches",
  "Heist Gear",
  "Heist Tools",
  "Heist Cloaks",
  "Expedition Logbooks",
  "Relics",
  "Sanctified Relics",
  "Idols",
];

const POE1_STAT_FILES = [
  "metadata/statdescriptions/stat_descriptions.txt",
  "metadata/statdescriptions/map_stat_descriptions.txt",
  "metadata/statdescriptions/heist_equipment_stat_descriptions.txt",
  "metadata/statdescriptions/sanctum_relic_stat_descriptions.txt",
  "metadata/statdescriptions/atlas_stat_descriptions.txt",
];

const POE2_STAT_FILES = [
  "data/statdescriptions/stat_descriptions.csd",
  "data/statdescriptions/map_stat_descriptions.csd",
  "data/statdescriptions/heist_equipment_stat_descriptions.csd",
  "data/statdescriptions/sanctum_relic_stat_descriptions.csd",
];

export interface ModStats {
  label: string;
  description: string;
}

export interface Mod {
  name: string;
  id: string;
  tags: string[];
  type: string;
  position?: "prefix" | "suffix" | "affix" | "enchant";
  bases?: string[];
  stats: ModStats[][];
}

interface SingleMod extends Omit<Mod, "stats"> {
  stats: ModStats[];
  domain?: number;
  ids?: string[];
  weights?: number[];
}

type ItFileDefinition = {
  extends?: string;
  tag?: string;
};

type ItFileHierarchy = {
  [path: string]: ItFileDefinition;
};

function countConsecutiveEntryStats(
  entry: StatDescriptionEntry,
  statKeys: { Id: string }[],
  startIndex: number,
): number {
  const entryStatIds = entry.statIds;
  let count = 1;
  for (let j = 1; j < entryStatIds.length; j++) {
    const nextIdx = startIndex + j;
    if (nextIdx >= statKeys.length) break;
    if (!statKeys[nextIdx] || statKeys[nextIdx].Id !== entryStatIds[j]) break;
    count++;
  }
  return count;
}

function parseItFile(content: string): ItFileDefinition {
  const def: ItFileDefinition = {};
  const lines = content.split("\n").map((line) => line.trim());
  let inBaseSection = false;

  for (const line of lines) {
    if (line.startsWith("extends")) {
      def.extends = line.match(/"([^"]+)"/)?.[1];
      continue;
    }
    if (line === "Base") {
      inBaseSection = true;
      continue;
    }
    if (inBaseSection && line === "}") {
      inBaseSection = false;
      continue;
    }
    if (inBaseSection && line.startsWith("tag")) {
      def.tag = line.match(/"([^"]+)"/)?.[1];
    }
  }
  return def;
}

function getAllTags(itemPath: string, hierarchy: ItFileHierarchy): string[] {
  const tags: string[] = [];
  let currentPath = itemPath;
  while (currentPath) {
    const def = hierarchy[currentPath];
    if (!def) break;
    if (def.tag) tags.push(def.tag);
    currentPath = def.extends || "";
  }
  return tags;
}

export async function extractMods(
  patch: string,
  db: NodeDatabase,
  loader: NodeBundleManager,
): Promise<Mod[]> {
  const gameVersion = patch.startsWith("3") ? 1 : 2;

  console.log("Extracting mods...");

  const statDescriptions = await getStatDescriptions(
    patch,
    loader,
    gameVersion,
  );

  const itemClassCol = gameVersion === 1 ? "ItemClassesKey" : "ItemClass";
  const tagsCol = gameVersion === 1 ? "TagsKeys" : "Tags";
  const baseItems = db.query(
    `SELECT Name, ${itemClassCol}, ${tagsCol}, InheritsFrom, ModDomain FROM "${patch}_BaseItemTypes"`,
  );
  const tagsTable = db.query(`SELECT _index, Id FROM "${patch}_Tags"`);
  const tagsMap = Object.fromEntries(tagsTable.map((t) => [t._index, t.Id]));
  const itemClasses = db.query(
    `SELECT _index, Name FROM "${patch}_ItemClasses"`,
  );
  const classesMap = Object.fromEntries(
    itemClasses.map((t) => [t._index, t.Name]),
  );
  const hierarchy = await buildHierarchy(
    patch,
    loader,
    baseItems as { InheritsFrom: string }[],
    gameVersion,
  );

  const modsTable = db.query(
    `SELECT * FROM "${patch}_Mods" WHERE GenerationType IN(${GenType.PREFIX}, ${GenType.SUFFIX}, ${GenType.ENCHANTMENT}, ${GenType.BLIGHT_TOWER}, ${GenType.FLASK_ENCHANTMENT_ENKINDLING}, ${GenType.FLASK_ENCHANTMENT_INSTILLING})`,
  );
  const statsTable = db.query(`SELECT * FROM "${patch}_Stats"`);
  const statsMap = Object.fromEntries(
    statsTable.map((s) => [s._index as number, s]),
  ) as Record<string, { _index: number; Id: string }>;

  const modTypes = db.query(`SELECT _index, Name FROM "${patch}_ModType"`);
  const modTypesMap = Object.fromEntries(
    modTypes.map((t) => [t._index, t.Name]),
  );

  let itemMods: Record<string, SingleMod>;
  if (gameVersion === 2) {
    itemMods = extractPoE2(
      statDescriptions,
      hierarchy,
      baseItems,
      tagsMap,
      classesMap,
      modsTable,
      statsMap,
      modTypesMap,
    );
  } else {
    itemMods = extractPoE1(
      statDescriptions,
      hierarchy,
      baseItems,
      tagsMap,
      classesMap,
      modsTable,
      statsMap,
      modTypesMap,
    );
  }

  const byModName: Record<
    string,
    {
      type: string;
      name: string;
      id: string;
      position: "prefix" | "suffix" | "affix" | "enchant";
      stats: ModStats[][];
      tags: string[];
      bases: string[];
    }
  > = {};

  for (const mod of Object.values(itemMods)) {
    if (!mod.type) continue;

    if (byModName[mod.name]) {
      byModName[mod.name].bases = Array.from(
        new Set([...byModName[mod.name].bases, ...(mod.bases || [])]),
      );
      byModName[mod.name].tags = Array.from(
        new Set([...byModName[mod.name].tags, ...mod.tags]),
      );
      byModName[mod.name].stats = [...byModName[mod.name].stats, mod.stats];
    } else {
      byModName[mod.name] = {
        type: mod.type,
        name: mod.name,
        id: mod.id,
        position: mod.position || "affix",
        stats: [mod.stats],
        tags: mod.tags,
        bases: mod.bases || [],
      };
    }
  }

  const finalMods = Object.values(byModName);
  console.log(`Extracted ${finalMods.length} mods`);
  return finalMods;
}

async function getStatDescriptions(
  patch: string,
  loader: NodeBundleManager,
  gameVersion: number,
): Promise<Record<string, StatDescriptionEntry>> {
  const lookup: Record<string, StatDescriptionEntry> = {};
  const files = gameVersion === 1 ? POE1_STAT_FILES : POE2_STAT_FILES;

  for (const filePath of files) {
    const contentUint8 = await loader.getFileContents(patch, filePath);
    const decoder = new TextDecoder("utf-16le");
    const content = decoder.decode(contentUint8);
    const parsed = parseStatDescriptionFile(content);
    Object.assign(lookup, parsed);
  }

  return lookup;
}

async function buildHierarchy(
  patch: string,
  loader: NodeBundleManager,
  baseItems: { InheritsFrom: string }[],
  gameVersion: number,
): Promise<ItFileHierarchy> {
  const inheritsFroms = new Set<string>();
  const processed = new Set<string>();

  for (const base of baseItems) {
    if (base.InheritsFrom) {
      await recursivelyFetchInheritsFromFiles(
        patch,
        loader,
        base.InheritsFrom as string,
        inheritsFroms,
        processed,
      );
    }
  }

  const hierarchy: ItFileHierarchy = {};
  for (const inheritsFrom of inheritsFroms) {
    const pathName = `${inheritsFrom}.it`.toLowerCase();
    try {
      const contentUint8 = await loader.getFileContents(patch, pathName);
      const decoder = new TextDecoder("utf-16le");
      const content = decoder.decode(contentUint8);
      hierarchy[inheritsFrom] = parseItFile(content);
    } catch (err) {
      console.warn(`Failed to parse .it file: ${pathName}`, err);
    }
  }
  return hierarchy;
}

async function recursivelyFetchInheritsFromFiles(
  patch: string,
  loader: NodeBundleManager,
  filePath: string,
  inheritsFroms: Set<string>,
  processed: Set<string>,
): Promise<void> {
  if (processed.has(filePath) || filePath === "nothing") return;

  inheritsFroms.add(filePath);
  processed.add(filePath);

  const pathName = `${filePath}.it`.toLowerCase();
  try {
    const contentUint8 = await loader.getFileContents(patch, pathName);
    const decoder = new TextDecoder("utf-16le");
    const content = decoder.decode(contentUint8);
    const def = parseItFile(content);

    if (def.extends) {
      await recursivelyFetchInheritsFromFiles(
        patch,
        loader,
        def.extends,
        inheritsFroms,
        processed,
      );
    }
  } catch {
    // .it file not found, skip
  }
}

function extractPoE1(
  statDescriptions: Record<string, StatDescriptionEntry>,
  hierarchy: ItFileHierarchy,
  baseItems: Record<string, unknown>[],
  tagsMap: Record<string, unknown>,
  classesMap: Record<string, unknown>,
  modsTable: Record<string, unknown>[],
  statsMap: Record<string, { _index: number; Id: string }>,
  modTypesMap: Record<string, unknown>,
): Record<string, SingleMod> {
  const itemMods: Record<string, SingleMod> = {};

  for (const mod of modsTable) {
    if (!mod.SpawnWeight_TagsKeys) continue;

    const tagKeys = Array.isArray(mod.SpawnWeight_TagsKeys)
      ? mod.SpawnWeight_TagsKeys
      : JSON.parse(mod.SpawnWeight_TagsKeys as string);

    const weights = Array.isArray(mod.SpawnWeight_Values)
      ? mod.SpawnWeight_Values
      : JSON.parse(mod.SpawnWeight_Values as string);

    const ids = tagKeys.map((key: number) => tagsMap[key]).filter(Boolean);

    if (!mod.Name) continue;

    const implicitTagKeys = Array.isArray(mod.ImplicitTagsKeys)
      ? mod.ImplicitTagsKeys
      : JSON.parse(mod.ImplicitTagsKeys as string);

    const affixTags = implicitTagKeys
      .map((key: number) => tagsMap[key])
      .filter((tag: string) => tag && !tag.endsWith("_damage"));

    const position = getPosition(mod.GenerationType as string);

    const allStats = extractStats(mod, statsMap, statDescriptions, "poe1");

    let typeName = "";
    if (mod.ModTypeKey != null && modTypesMap[mod.ModTypeKey as number]) {
      typeName = (modTypesMap[mod.ModTypeKey as number] as string)
        .replace(/([A-Z])/g, (match: string) => `_${match.toLowerCase()}`)
        .replace(/^_/, "");
    }

    itemMods[mod.Id as string] = {
      name: mod.Name as string,
      id: mod.Id as string,
      stats: allStats,
      tags: affixTags,
      type: typeName,
      position,
      ids,
      weights,
      domain: mod.Domain as number,
      bases: [],
    };
  }

  assignBasesToMods(
    itemMods,
    baseItems,
    tagsMap,
    classesMap,
    hierarchy,
    "poe1",
  );
  return itemMods;
}

function extractPoE2(
  statDescriptions: Record<string, StatDescriptionEntry>,
  hierarchy: ItFileHierarchy,
  baseItems: Record<string, unknown>[],
  tagsMap: Record<string, unknown>,
  classesMap: Record<string, unknown>,
  modsTable: Record<string, unknown>[],
  statsMap: Record<string, unknown>,
  modTypesMap: Record<string, unknown>,
): Record<string, SingleMod> {
  const itemMods: Record<string, SingleMod> = {};

  for (const mod of modsTable) {
    if (!mod.SpawnWeight_Tags) continue;

    const tagKeys = Array.isArray(mod.SpawnWeight_Tags)
      ? mod.SpawnWeight_Tags
      : JSON.parse(mod.SpawnWeight_Tags as string);

    const weights = Array.isArray(mod.SpawnWeight_Values)
      ? mod.SpawnWeight_Values
      : JSON.parse(mod.SpawnWeight_Values as string);

    const ids = tagKeys.map((key: number) => tagsMap[key]).filter(Boolean);

    if (!mod.Name) continue;

    const implicitTagKeys = Array.isArray(mod.ImplicitTags)
      ? mod.ImplicitTags
      : JSON.parse(mod.ImplicitTags as string);

    const affixTags = implicitTagKeys
      .map((key: number) => tagsMap[key])
      .filter((tag: string) => tag && !tag.endsWith("_damage"));

    const position = getPosition(mod.GenerationType as string);

    const allStats = extractStats(
      mod,
      statsMap as Record<string, { _index: number; Id: string }>,
      statDescriptions,
      "poe2",
    );

    let typeName = "";
    if (mod.ModType != null && modTypesMap[mod.ModType as number]) {
      typeName = (modTypesMap[mod.ModType as number] as string)
        .replace(/([A-Z])/g, (match: string) => `_${match.toLowerCase()}`)
        .replace(/^_/, "");
    }

    itemMods[mod.Id as string] = {
      name: mod.Name as string,
      id: mod.Id as string,
      stats: allStats,
      tags: affixTags,
      type: typeName,
      position,
      ids,
      weights,
      domain: mod.Domain as number,
      bases: [],
    };
  }

  assignBasesToMods(
    itemMods,
    baseItems,
    tagsMap,
    classesMap,
    hierarchy,
    "poe2",
  );
  return itemMods;
}

function getPosition(
  genType: string,
): "prefix" | "suffix" | "affix" | "enchant" {
  const gen = parseInt(genType);
  if (gen === GenType.PREFIX) return "prefix";
  if (gen === GenType.SUFFIX) return "suffix";
  if (
    [
      GenType.ENCHANTMENT,
      GenType.FLASK_ENCHANTMENT_INSTILLING,
      GenType.FLASK_ENCHANTMENT_ENKINDLING,
      GenType.BLIGHT_TOWER,
    ].includes(gen)
  )
    return "enchant";
  return "affix";
}

function extractStats(
  mod: Record<string, unknown>,
  statsMap: Record<string, { _index: number; Id: string }>,
  statDescriptions: Record<string, StatDescriptionEntry>,
  version: "poe1" | "poe2",
): ModStats[] {
  const allStats: ModStats[] = [];

  const statKeys =
    version === "poe1"
      ? [mod.StatsKey1, mod.StatsKey2, mod.StatsKey3, mod.StatsKey4]
          .filter((key) => key !== null && key !== undefined)
          .map((key) => statsMap[key as number])
      : [mod.Stat1, mod.Stat2, mod.Stat3, mod.Stat4]
          .filter((key) => key !== null && key !== undefined)
          .map((key) => statsMap[key as number]);

  const processed = new Set<number>();
  for (let i = 0; i < statKeys.length; i++) {
    if (processed.has(i)) continue;
    const stat = statKeys[i];
    if (!stat) continue;

    const entry = statDescriptions[stat.Id];
    if (!entry) continue;

    const consecutiveCount = countConsecutiveEntryStats(entry, statKeys, i);
    const values: [number, number][] = [];
    let label = "";

    for (let j = 0; j < consecutiveCount; j++) {
      const si = i + j;
      if (version === "poe2") {
        const val =
          typeof mod[`Stat${si + 1}Value`] === "string"
            ? JSON.parse(mod[`Stat${si + 1}Value`] as string)
            : mod[`Stat${si + 1}Value`];
        values.push(val ? [val[0], val[1]] : [0, 0]);
        if (!label && statKeys[si]?.Id) {
          const text = (statKeys[si] as Record<string, unknown>).Text as
            | string
            | undefined;
          if (text) {
            label = text.replace(/\b(Minimum|Maximum|Local)\s+/gi, "");
          }
        }
      } else {
        values.push([
          (mod[`Stat${si + 1}Min`] as number) ?? 0,
          (mod[`Stat${si + 1}Max`] as number) ?? 0,
        ]);
      }
      processed.add(si);
    }

    const description = formatStatDescription(entry, values);
    if (description) {
      allStats.push({ label: label || description, description });
    }
  }

  return allStats;
}

function assignBasesToMods(
  itemMods: Record<string, SingleMod>,
  baseItems: Record<string, unknown>[],
  tagsMap: Record<string, unknown>,
  classesMap: Record<string, unknown>,
  hierarchy: ItFileHierarchy,
  version: "poe1" | "poe2",
): void {
  const classCol = version === "poe1" ? "ItemClassesKey" : "ItemClass";
  const tagsCol = version === "poe1" ? "TagsKeys" : "Tags";

  for (const base of baseItems) {
    if (!base[classCol]) continue;
    const className = classesMap[base[classCol] as number];
    if (!MODIFIABLE_CLASSES.includes(className as string)) continue;

    const name = base.Name as string;
    const extendedTags = getAllTags(base.InheritsFrom as string, hierarchy);

    const baseTagKeys = Array.isArray(base[tagsCol])
      ? base[tagsCol]
      : JSON.parse(base[tagsCol] as string);

    const baseTags = [
      ...baseTagKeys.map((key: number) => tagsMap[key]),
      ...extendedTags,
    ].filter(Boolean);

    const domain = base.ModDomain;
    if (!baseTags.length) continue;

    for (const mod of Object.values(itemMods)) {
      if (mod.domain !== domain) continue;
      if (!mod.weights || !mod.ids) continue;

      for (let i = 0; i < mod.weights.length; i++) {
        const weight = mod.weights[i];
        const id = mod.ids[i];

        if (weight > 0 && baseTags.includes(id)) {
          if (!mod.bases) mod.bases = [];
          if (!mod.bases.includes(name)) {
            mod.bases.push(name);
          }
        }
      }
    }
  }
}
