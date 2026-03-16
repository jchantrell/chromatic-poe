import Fuse, { type FuseResult } from "fuse.js";
import type { BundleManager } from "./bundle";
import type { Database } from "./db";
import type { IDBManager } from "./idb";
import {
  parseStatDescriptionFile,
  formatStatDescription,
  type StatDescriptionEntry,
} from "./stat-descriptions";
import { to } from "./utils";

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

type ItFileDefinition = {
  extends?: string;
  tag?: string;
};

type ItFileHierarchy = {
  [path: string]: ItFileDefinition;
};

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
  domain?: number;
  ids?: string[];
  weights?: number[];
  [key: string]: unknown;
}

export interface SingleMod extends Omit<Mod, "stats"> {
  stats: ModStats[];
}

export interface SearchableMod extends Mod {
  searchStats: ModStats[];
}

export class ModManager {
  constructor(
    private loader: BundleManager,
    private idb: IDBManager,
    private db: Database,
  ) {}

  async getMods(patch: string) {
    const db = await this.idb.getInstance();
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const key = `${gameVersion}/mods`;
    return await db.get("mods", key);
  }

  async extract(
    patch: string,
    onProgress?: (percent: number, msg: string) => void,
  ) {
    const gameVersion = patch.startsWith("3") ? 1 : 2;

    console.log("Extracting mods...");

    if (onProgress) onProgress(0, "Fetching stat descriptions...");
    const statDescriptions = await this.getStatDescriptions(patch);

    if (onProgress) onProgress(10, "Building stat hierarchy...");
    const itemClassCol = gameVersion === 1 ? "ItemClassesKey" : "ItemClass";
    const tagsCol = gameVersion === 1 ? "TagsKeys" : "Tags";
    const baseItems = await this.db.query(
      `SELECT Name, ${itemClassCol}, ${tagsCol}, InheritsFrom, ModDomain FROM "${patch}_BaseItemTypes"`,
    );
    const tagsTable = await this.db.query(
      `SELECT _index, Id FROM "${patch}_Tags"`,
    );
    const tagsMap = Object.fromEntries(tagsTable.map((t) => [t._index, t.Id]));
    const itemClasses = await this.db.query(
      `SELECT _index, Name FROM "${patch}_ItemClasses"`,
    );
    const classesMap = Object.fromEntries(
      itemClasses.map((t) => [t._index, t.Name]),
    );
    const hierarchy = await this.buildHierarchy(patch, baseItems, gameVersion);

    if (onProgress) onProgress(20, "Extracting mods...");
    const modsTable = await this.db.query(
      `SELECT * FROM "${patch}_Mods" WHERE GenerationType IN(${GenType.PREFIX}, ${GenType.SUFFIX}, ${GenType.ENCHANTMENT}, ${GenType.BLIGHT_TOWER}, ${GenType.FLASK_ENCHANTMENT_ENKINDLING}, ${GenType.FLASK_ENCHANTMENT_INSTILLING})`,
    );
    const statsTable = await this.db.query(`SELECT * FROM "${patch}_Stats"`);
    const statsMap = Object.fromEntries(statsTable.map((s) => [s._index, s]));
    const modTypes = await this.db.query(
      `SELECT _index, Name FROM "${patch}_ModType"`,
    );
    const modTypesMap = Object.fromEntries(
      modTypes.map((t) => [t._index, t.Name]),
    );
    let itemMods: Record<string, SingleMod>;
    if (gameVersion === 2) {
      itemMods = await this.extractPoE2(
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
      itemMods = await this.extractPoE1(
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

    if (onProgress) onProgress(80, "Building mods...");
    const byModName: Record<
      string,
      {
        type: string;
        name: string;
        id: string;
        label: string;
        position: "prefix" | "suffix" | "affix" | "enchant";
        stats: { label: string; description: string }[][];
        tags: string[];
        bases: string[];
      }
    > = {};
    for (const mod of Object.values(itemMods) as any[]) {
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
          label: mod.stats.length === 1 ? mod.stats[0].label : "",
          position: mod.position || "affix",
          stats: [mod.stats],
          tags: mod.tags,
          bases: mod.bases || [],
        };
      }
    }

    const finalMods = Object.values(byModName);

    const db = await this.idb.getInstance();
    const key = `${gameVersion}/mods`;
    await db.put("mods", finalMods, key);
    return finalMods;
  }

  async getStatDescriptions(patch: string) {
    const lookup: Record<string, StatDescriptionEntry> = {};

    const gameVersion = patch.startsWith("3") ? 1 : 2;

    for (const filePath of gameVersion === 1
      ? POE1_STAT_FILES
      : POE2_STAT_FILES) {
      const contentUint8 = await this.loader.getFileContents(patch, filePath);
      const decoder = new TextDecoder("utf-16le");
      const content = decoder.decode(contentUint8);
      const parsed = parseStatDescriptionFile(content);
      Object.assign(lookup, parsed);
    }

    return lookup;
  }

  async buildHierarchy(
    patch: string,
    baseItems: { InheritsFrom: "string" }[],
    gameVersion: number,
  ): Promise<ItFileHierarchy> {
    const inheritsFroms = new Set<string>();
    const processed = new Set<string>();

    for (const base of baseItems) {
      if (base.InheritsFrom) {
        await this.recursivelyFetchInheritsFromFiles(
          patch,
          base.InheritsFrom,
          inheritsFroms,
          processed,
          gameVersion,
        );
      }
    }

    const hierarchy: ItFileHierarchy = {};
    for (const inheritsFrom of inheritsFroms) {
      const pathName = `${inheritsFrom}.it`.toLowerCase();
      const [err] = await to(
        (async () => {
          const contentUint8 = await this.loader.getFileContents(
            patch,
            pathName,
          );
          const decoder = new TextDecoder("utf-16le");
          const content = decoder.decode(contentUint8);
          hierarchy[inheritsFrom] = this.parseItFile(content);
        })(),
      );

      if (err) {
        console.warn(`Failed to parse .it file: ${pathName}`, err);
      }
    }
    return hierarchy;
  }

  async recursivelyFetchInheritsFromFiles(
    patch: string,
    filePath: string,
    inheritsFroms: Set<string>,
    processed: Set<string>,
    gameVersion: number,
  ) {
    if (processed.has(filePath) || filePath === "nothing") return;

    inheritsFroms.add(filePath);
    processed.add(filePath);

    const pathName = `${filePath}.it`.toLowerCase();
    const contentUint8 = await this.loader.getFileContents(patch, pathName);
    const decoder = new TextDecoder("utf-16le");
    const content = decoder.decode(contentUint8);
    const def = this.parseItFile(content);

    if (def.extends) {
      await this.recursivelyFetchInheritsFromFiles(
        patch,
        def.extends,
        inheritsFroms,
        processed,
        gameVersion,
      );
    }
  }

  parseItFile(content: string): ItFileDefinition {
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

  getAllTags(itemPath: string, hierarchy: ItFileHierarchy): string[] {
    const tags: string[] = [];
    let currentPath = itemPath;

    while (currentPath) {
      const def = hierarchy[currentPath];
      if (!def) break;

      if (def.tag) {
        tags.push(def.tag);
      }

      currentPath = def.extends || "";
    }

    return tags;
  }

  async extractPoE1(
    statDescriptions: Record<string, StatDescriptionEntry>,
    hierarchy: ItFileHierarchy,
    baseItems: { [key: string]: unknown }[],
    tagsMap: Record<string, unknown>,
    classesMap: Record<string, unknown>,
    modsTable: Record<string, unknown>[],
    statsMap: Record<string, { _index: number; Id: string }>,
    modTypesMap: Record<string, unknown>,
  ): Promise<Record<string, SingleMod>> {
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

      const position =
        parseInt(mod.GenerationType as string) === GenType.PREFIX
          ? "prefix"
          : parseInt(mod.GenerationType as string) === GenType.SUFFIX
            ? "suffix"
            : [
                  GenType.ENCHANTMENT,
                  GenType.FLASK_ENCHANTMENT_INSTILLING,
                  GenType.FLASK_ENCHANTMENT_ENKINDLING,
                  GenType.BLIGHT_TOWER,
                ].includes(parseInt(mod.GenerationType as string))
              ? "enchant"
              : "affix";

      const allStats: { label: string; description: string }[] = [];
      const statKeys = [
        mod.StatsKey1,
        mod.StatsKey2,
        mod.StatsKey3,
        mod.StatsKey4,
      ]
        .filter((key) => key !== null && key !== undefined)
        .map((key) => statsMap[key as number]);

      const processed = new Set<number>();
      for (let i = 0; i < statKeys.length; i++) {
        if (processed.has(i)) continue;
        const stat = statKeys[i];
        if (!stat) continue;

        const entry = statDescriptions[stat.Id];
        if (!entry) {
          allStats.push({ label: "", description: "" });
          continue;
        }

        const entryStatCount = entry.statIds.length;
        const values: [number, number][] = [];
        for (let j = 0; j < entryStatCount; j++) {
          const si = i + j;
          values.push([
            (mod[`Stat${si + 1}Min`] as number) ?? 0,
            (mod[`Stat${si + 1}Max`] as number) ?? 0,
          ]);
          processed.add(si);
        }

        const description = formatStatDescription(entry, values);
        allStats.push({ label: description, description });
      }

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

    for (const base of baseItems) {
      if (!base.ItemClassesKey) continue;
      const className = classesMap[base.ItemClassesKey];
      if (!MODIFIABLE_CLASSES.includes(className)) continue;

      const name = base.Name;
      const extendedTags = this.getAllTags(base.InheritsFrom, hierarchy);

      const baseTagKeys = Array.isArray(base.TagsKeys)
        ? base.TagsKeys
        : JSON.parse(base.TagsKeys as string);

      const baseTags = [
        ...baseTagKeys.map((key: number) => tagsMap[key]),
        ...extendedTags,
      ].filter(Boolean);

      const domain = base.ModDomain;

      if (!baseTags.length) continue;

      for (const mod of Object.values(itemMods) as any[]) {
        if (mod.domain !== domain) continue;
        if (!mod.weights || !mod.ids) continue;

        for (let i = 0; i < mod.weights.length; i++) {
          const weight = mod.weights[i];
          const id = mod.ids[i];

          if (weight > 0 && baseTags.includes(id)) {
            if (
              itemMods[mod.id] &&
              !(itemMods[mod.id] as any).bases?.includes(name)
            ) {
              if (!(itemMods[mod.id] as any).bases)
                (itemMods[mod.id] as any).bases = [];
              (itemMods[mod.id] as any).bases!.push(name);
            }
          }
        }
      }
    }

    return itemMods;
  }

  async extractPoE2(
    statDescriptions: Record<string, StatDescriptionEntry>,
    hierarchy: ItFileHierarchy,
    baseItems: any[],
    tagsMap: any,
    classesMap: any,
    modsTable: any[],
    statsMap: any,
    modTypesMap: any,
  ): Promise<Record<string, SingleMod>> {
    const itemMods: Record<string, SingleMod> = {};

    for (const mod of modsTable) {
      if (!mod.SpawnWeight_TagsKeys) continue;

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

      const position =
        parseInt(mod.GenerationType as string) === GenType.PREFIX
          ? "prefix"
          : parseInt(mod.GenerationType as string) === GenType.SUFFIX
            ? "suffix"
            : [
                  GenType.ENCHANTMENT,
                  GenType.FLASK_ENCHANTMENT_INSTILLING,
                  GenType.FLASK_ENCHANTMENT_ENKINDLING,
                  GenType.BLIGHT_TOWER,
                ].includes(parseInt(mod.GenerationType as string))
              ? "enchant"
              : "affix";

      const allStats: { label: string; description: string }[] = [];
      const statKeys = [mod.Stat1, mod.Stat2, mod.Stat3, mod.Stat4]
        .filter((key) => key !== null && key !== undefined)
        .map((key) => statsMap[key]);

      const processed = new Set<number>();
      for (let i = 0; i < statKeys.length; i++) {
        if (processed.has(i)) continue;
        const stat = statKeys[i];
        if (!stat) continue;

        const entry = statDescriptions[stat.Id];
        if (!entry) {
          const label = stat.Text
            ? stat.Text.replace(/\b(Minimum|Maximum|Local)\s+/gi, "")
            : "";
          allStats.push({ label, description: "" });
          continue;
        }

        const entryStatCount = entry.statIds.length;
        const values: [number, number][] = [];
        let label = "";
        for (let j = 0; j < entryStatCount; j++) {
          const si = i + j;
          const val =
            typeof mod[`Stat${si + 1}Value`] === "string"
              ? JSON.parse(mod[`Stat${si + 1}Value`])
              : mod[`Stat${si + 1}Value`];
          values.push(val ? [val[0], val[1]] : [0, 0]);
          if (!label && statKeys[si]?.Text) {
            label = statKeys[si].Text.replace(
              /\b(Minimum|Maximum|Local)\s+/gi,
              "",
            );
          }
          processed.add(si);
        }

        const description = formatStatDescription(entry, values);
        allStats.push({ label: label || description, description });
      }

      let typeName = "";
      if (mod.ModType != null && modTypesMap[mod.ModType]) {
        typeName = modTypesMap[mod.ModType]
          .replace(/([A-Z])/g, (match: string) => `_${match.toLowerCase()}`)
          .replace(/^_/, "");
      }

      itemMods[mod.Id] = {
        name: mod.Name,
        id: mod.Id,
        stats: allStats,
        tags: affixTags,
        type: typeName,
        position,
        ids,
        weights,
        domain: mod.Domain,
        bases: [],
      };
    }

    for (const base of baseItems) {
      if (!base.ItemClass) continue; // ItemClass index in V2
      const className = classesMap[base.ItemClass];
      if (!MODIFIABLE_CLASSES.includes(className)) continue;

      const name = base.Name;
      const extendedTags = this.getAllTags(base.InheritsFrom, hierarchy);

      const baseTagKeys = Array.isArray(base.Tags)
        ? base.Tags
        : JSON.parse(base.Tags as string);

      const baseTags = [
        ...baseTagKeys.map((key: number) => tagsMap[key]),
        ...extendedTags,
      ].filter(Boolean);

      const domain = base.ModDomain;

      if (!baseTags.length) continue;

      for (const mod of Object.values(itemMods) as any[]) {
        if (mod.domain !== domain) continue;
        if (!mod.weights || !mod.ids) continue;

        for (let i = 0; i < mod.weights.length; i++) {
          const weight = mod.weights[i];
          const id = mod.ids[i];

          if (weight > 0 && baseTags.includes(id)) {
            if (
              itemMods[mod.id] &&
              !(itemMods[mod.id] as any).bases?.includes(name)
            ) {
              if (!(itemMods[mod.id] as any).bases)
                (itemMods[mod.id] as any).bases = [];
              (itemMods[mod.id] as any).bases!.push(name);
            }
          }
        }
      }
    }

    return itemMods;
  }
}

class ModIndex {
  searchIndex!: Fuse<SearchableMod>;

  init(mods: Mod[]) {
    this.setMods(
      mods
        .filter(
          (mod) =>
            mod.position &&
            ["prefix", "suffix", "affix"].includes(mod.position),
        )
        .map((mod) => ({
          ...mod,
          searchStats: mod.stats ? mod.stats.flat() : [],
        })) as SearchableMod[],
    );
  }

  setMods(mods: SearchableMod[]) {
    const options = {
      keys: ["name", "searchStats.description"],
      useExtendedSearch: true,
      minMatchCharLength: 2,
      distance: 160,
      threshold: 0.6,
    };
    this.searchIndex = new Fuse(mods, options);
  }

  search(
    args: Parameters<typeof this.searchIndex.search>[0],
  ): FuseResult<SearchableMod>[] {
    // handle empty search
    if (!args || (typeof args === "string" && !args.length)) {
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(`'${args}`);
  }
}

class EnchantIndex {
  searchIndex!: Fuse<SearchableMod>;

  init(mods: Mod[]) {
    this.setMods(
      mods
        .filter((mod) => mod.position === "enchant")
        .map((mod) => ({
          ...mod,
          searchStats: mod.stats ? mod.stats.flat() : [],
        })) as SearchableMod[],
    );
  }

  setMods(mods: SearchableMod[]) {
    const options = {
      keys: ["name", "searchStats.description"],
      useExtendedSearch: true,
      minMatchCharLength: 2,
      distance: 160,
      threshold: 0.6,
    };
    this.searchIndex = new Fuse(mods, options);
  }

  search(
    args: Parameters<typeof this.searchIndex.search>[0],
  ): FuseResult<SearchableMod>[] {
    // handle empty search
    if (!args || (typeof args === "string" && !args.length)) {
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(`'${args}`);
  }
}

export const modIndex = new ModIndex();
export const enchantIndex = new EnchantIndex();
