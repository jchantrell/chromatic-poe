import classes from "./poe1/tables/English/ItemClasses.json";
import bases from "./poe1/tables/English/BaseItemTypes.json";
import tags from "./poe1/tables/English/Tags.json";
import mods from "./poe1/tables/English/Mods.json";
import modTypes from "./poe1/tables/English/ModType.json";
import stats from "./poe1/tables/English/Stats.json";

import classesV2 from "./poe2/tables/English/ItemClasses.json";
import basesV2 from "./poe2/tables/English/BaseItemTypes.json";
import tagsV2 from "./poe2/tables/English/Tags.json";
import modsV2 from "./poe2/tables/English/Mods.json";
import modTypesV2 from "./poe2/tables/English/ModType.json";
import goldModPricesV2 from "./poe2/tables/English/GoldModPrices.json";
import statsV2 from "./poe2/tables/English/Stats.json";

import Database, { type Database as IDatabase } from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { FileLoader } from "./loader";
import { BundleIndex } from "./bundle";
import { exportFiles } from "./file";

export type Config = {
  patch: string;
  translations: string[];
  tables: { [key: string]: string }[];
};

export type Item = {
  name: string;
  category: string;
  class: string;
  type: string;
  art: string;
  itemClass: string;
  base: string;
};

type ItFileDefinition = {
  extends?: string;
  tag?: string;
};

type ItFileHierarchy = {
  [path: string]: ItFileDefinition;
};



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

export class DatFiles {
  gameVersion!: 1 | 2;
  config!: Config;
  db: IDatabase;
  loader!: FileLoader;
  index!: BundleIndex;

  constructor() {
    this.db = new Database("chromatic.db", {});
    this.db.pragma("journal_mode = WAL");
  }

  async init(config: Config) {
    this.config = config;
    this.gameVersion = config.patch.startsWith("4") ? 2 : 1;
    this.loader = new FileLoader(
      path.join(process.cwd(), "/.cache"),
      config.patch,
    );
    this.index = new BundleIndex(this.loader);
    await this.loader.init();
    await this.index.loadIndex();
  }



  async extractModsV1() {
    const extraFiles = [
      "metadata/statdescriptions/stat_descriptions.txt",
      "metadata/statdescriptions/atlas_stat_descriptions.txt",
      "metadata/statdescriptions/map_stat_descriptions.txt",
      "metadata/statdescriptions/heist_equipment_stat_descriptions.txt",
      "metadata/statdescriptions/sanctum_relic_stat_descriptions.txt",
    ];
    await exportFiles(
      extraFiles,
      path.join(process.cwd(), "packages/data/poe1/files"),
      this.loader,
      this.gameVersion,
    );
    const statDescriptions = this.getStatDescriptions();
    const inheritsFroms = await this.collectInheritsFromFiles(bases);

    const hierarchy: ItFileHierarchy = {};
    for (const inheritsFrom of inheritsFroms) {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "packages/data/poe1/files",
          `${inheritsFrom}.it`.toLowerCase().replaceAll("/", "@"),
        ),
        "utf16le",
      );
      const config = this.parseItFile(content);
      hierarchy[inheritsFrom] = config;
    }

    const itemMods: Record<
      string,
      {
        name: string;
        id: string;
        label: string;
        tags: string[];
        type: string;
        position: string;
        ids: string[];
        weights: number[];
        stats: string[];
        domain: number;
        bases: [];
      }
    > = {};

    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      const ids = mod.SpawnWeight_TagsKeys.map((tag) => tags[tag].Id);
      const weights = mod.SpawnWeight_Values;
      if (mod.Name === "") continue;
      if (!ids.length) continue;

      const affixTags = mod.ImplicitTagsKeys.map((tag) => tags[tag].Id).filter(
        (tag) => !tag.endsWith("_damage"),
      );

      const position =
        mod.GenerationType === 1
          ? "prefix"
          : mod.GenerationType === 2
            ? "suffix"
            : "affix";

      const allStats: string[] = [];

      const statsMapped = [
        mod.StatsKey1,
        mod.StatsKey2,
        mod.StatsKey3,
        mod.StatsKey4,
      ]
        .filter((stat) => stat)
        .map((stat) => stats[stat]);

      for (let i = 0; i < statsMapped.length; i++) {
        const stat = statsMapped[i];
        const nextStat = statsMapped[i + 1];
        const statDescription = statDescriptions[stat.Id];
        const descs = statDescription
          ? statDescription.filter((desc) => desc.language === "English")
          : [];

        if (nextStat && i + 1 < statsMapped.length) {
          const currentDesc = descs[0]?.description;

          if (currentDesc?.includes(" to ")) {
            const values: [number, number][] = [
              [mod[`Stat${i + 1}Min`], mod[`Stat${i + 1}Max`]],
              [mod[`Stat${i + 2}Min`], mod[`Stat${i + 2}Max`]],
            ];

            const description = this.formatDescription(descs, values);
            allStats.push(description);

            i++;
            continue;
          }
        }

        const values: [number, number][] = [
          [mod[`Stat${i + 1}Min`], mod[`Stat${i + 1}Max`]],
        ];

        const description = this.formatDescription(descs, values);
        allStats.push(description);
      }

      const type = modTypes[mod.ModTypeKey].Name.replace(
        /([A-Z])/g,
        (match) => `_${match.toLowerCase()}`,
      ).replace(/^_/, "");

      itemMods[mod.Id] = {
        name: mod.Name,
        id: mod.Id,
        label: allStats.length === 1 ? allStats[0].label : "",
        stats: allStats,
        tags: affixTags,
        type,
        position,
        ids,
        weights,
        domain: mod.Domain,
        bases: [],
      };
    }

    for (const base of bases) {
      if (!MODIFIABLE_CLASSES.includes(classes[base.ItemClassesKey].Name))
        continue;
      const name = base.Name;
      const extendedTags = this.getAllTags(base.InheritsFrom, hierarchy);
      const baseTags = [
        ...JSON.parse(base.TagsKeys).map((tag) => tags[tag].Id),
        ...extendedTags,
      ];
      const domain = base.ModDomain;

      if (!baseTags.length) continue;

      for (const mod of Object.values(itemMods)) {
        if (mod.domain !== domain) continue;

        for (let i = 0; i < mod.weights.length; i++) {
          const weight = mod.weights[i];
          const id = mod.ids[i];

          if (weight && baseTags.includes(id)) {
            if (itemMods[mod.id] && !itemMods[mod.id].bases.includes(name)) {
              itemMods[mod.id].bases.push(name);
            }
          }
        }
      }
    }

    const byModName: Record<
      string,
      {
        type: string;
        name: string;
        label: string;
        position: string;
        stats: string[][];
        tags: string[];
        bases: string[];
      }
    > = {};
    for (const mod of Object.values(itemMods)) {
      if (byModName[mod.name]) {
        byModName[mod.name].bases = Array.from(
          new Set([...byModName[mod.name].bases, ...mod.bases]),
        );
        byModName[mod.name].tags = Array.from(
          new Set([...byModName[mod.name].tags, ...mod.tags]),
        );
        byModName[mod.name].stats = [...byModName[mod.name].stats, mod.stats];
      } else {
        byModName[mod.name] = {
          type: mod.type,
          name: mod.name,
          label: mod.label,
          position: mod.position,
          stats: [mod.stats],
          tags: mod.tags,
          bases: mod.bases,
        };
      }
    }

    console.log("Writing mods file...");
    fs.writeFileSync(
      "./packages/data/poe1/mods.json",
      JSON.stringify(
        Object.values(byModName).filter((mod) => mod.bases.length),
        null,
        " ",
      ),
    );
  }


  async extractModsV2() {
    const extraFiles = [
      "metadata/statdescriptions/stat_descriptions.csd",
      "metadata/statdescriptions/map_stat_descriptions.csd",
      "metadata/statdescriptions/heist_equipment_stat_descriptions.csd",
      "metadata/statdescriptions/sanctum_relic_stat_descriptions.csd",
    ];
    await exportFiles(
      extraFiles,
      path.join(process.cwd(), "packages/data/poe2/files"),
      this.loader,
      this.gameVersion,
    );
    const statDescriptions = this.getStatDescriptions();
    const inheritsFroms = await this.collectInheritsFromFiles(basesV2);

    const hierarchy: ItFileHierarchy = {};
    for (const inheritsFrom of inheritsFroms) {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "packages/data/poe2/files",
          `${inheritsFrom}.it`.toLowerCase().replaceAll("/", "@"),
        ),
        "utf16le",
      );
      const config = this.parseItFile(content);
      hierarchy[inheritsFrom] = config;
    }

    const itemMods: Record<
      string,
      {
        name: string;
        id: string;
        label: string;
        tags: string[];
        type: string;
        position: string;
        ids: string[];
        weights: number[];
        stats: { label: string; description: string }[];
        domain: number;
        bases: [];
      }
    > = {};

    for (let i = 0; i < goldModPricesV2.length; i++) {
      const intersection = goldModPricesV2[i];
      const mod = modsV2[intersection.Mod];
      const ids = intersection.Tags.map((tag) => tagsV2[tag].Id);
      const weights = intersection.SpawnWeight;
      if (mod.Name === "") continue;
      if (!ids.length) continue;

      const affixTags = mod.ImplicitTags.map((tag) => tagsV2[tag].Id).filter(
        (tag) => !tag.endsWith("_damage"),
      );

      const position =
        mod.GenerationType === 1
          ? "prefix"
          : mod.GenerationType === 2
            ? "suffix"
            : "affix";

      const allStats: { label: string; description: string }[] = [];

      const statsMapped = [mod.Stat1, mod.Stat2, mod.Stat3, mod.Stat4]
        .filter((stat) => stat)
        .map((stat) => statsV2[stat]);

      for (let i = 0; i < statsMapped.length; i++) {
        const stat = statsMapped[i];
        const nextStat = statsMapped[i + 1];
        const statDescription = statDescriptions[stat.Id];
        const descs = statDescription
          ? statDescription.filter((desc) => desc.language === "English")
          : [];

        if (nextStat && i + 1 < statsMapped.length) {
          const currentDesc = descs[0]?.description;
          const nextDescs = statDescriptions[nextStat.Id]?.filter(
            (desc) => desc.language === "English",
          );
          const nextDesc = nextDescs?.[0]?.description;

          if (currentDesc?.includes(" to ") && nextDesc?.includes(" to ")) {
            const values: [number, number][] = [
              [mod[`Stat${i + 1}Value`][0], mod[`Stat${i + 1}Value`][1]],
              [mod[`Stat${i + 2}Value`][0], mod[`Stat${i + 2}Value`][1]],
            ];

            allStats.push({
              label: (stat.Text || nextStat.Text || "").replace(
                /\b(Minimum|Maximum|Local)\s+/gi,
                "",
              ),
              description: this.formatDescription(descs, values),
            });

            i++;
            continue;
          }
        }

        const values: [number, number][] = [
          [mod[`Stat${i + 1}Value`][0], mod[`Stat${i + 1}Value`][1]],
        ];

        allStats.push({
          label: stat.Text.replace(/\b(Minimum|Maximum|Local)\s+/gi, ""),
          description: descs.length
            ? this.formatDescription(descs, values)
            : "",
        });
      }

      const type = modTypesV2[mod.ModType].Name.replace(
        /([A-Z])/g,
        (match) => `_${match.toLowerCase()}`,
      ).replace(/^_/, "");

      itemMods[mod.Id] = {
        name: mod.Name,
        id: mod.Id,
        label: allStats.length === 1 ? allStats[0].label : "",
        stats: allStats,
        tags: affixTags,
        type,
        position,
        ids,
        weights,
        domain: mod.Domain,
        bases: [],
      };
    }

    for (const base of basesV2) {
      if (!MODIFIABLE_CLASSES.includes(classesV2[base.ItemClass].Name))
        continue;
      const name = base.Name;
      const extendedTags = this.getAllTags(base.InheritsFrom, hierarchy);
      const baseTags = [
        ...JSON.parse(base.Tags).map((tag) => tagsV2[tag].Id),
        ...extendedTags,
      ];
      const domain = base.ModDomain;

      if (!baseTags.length) continue;

      for (const mod of Object.values(itemMods)) {
        if (mod.domain !== domain) continue;

        for (let i = 0; i < mod.weights.length; i++) {
          const weight = mod.weights[i];
          const id = mod.ids[i];

          if (weight && baseTags.includes(id)) {
            if (itemMods[mod.id] && !itemMods[mod.id].bases.includes(name)) {
              itemMods[mod.id].bases.push(name);
            }
          }
        }
      }
    }

    const byModName: Record<
      string,
      {
        type: string;
        name: string;
        label: string;
        position: string;
        stats: { label: string; description: string }[][];
        tags: string[];
        bases: string[];
      }
    > = {};
    for (const mod of Object.values(itemMods)) {
      if (byModName[mod.name]) {
        byModName[mod.name].bases = Array.from(
          new Set([...byModName[mod.name].bases, ...mod.bases]),
        );
        byModName[mod.name].tags = Array.from(
          new Set([...byModName[mod.name].tags, ...mod.tags]),
        );
        byModName[mod.name].stats = [...byModName[mod.name].stats, mod.stats];
      } else {
        byModName[mod.name] = {
          type: mod.type,
          name: mod.name,
          label: mod.label,
          position: mod.position,
          stats: [mod.stats],
          tags: mod.tags,
          bases: mod.bases,
        };
      }
    }

    console.log("Writing mods file...");
    fs.writeFileSync(
      "./packages/data/poe2/mods.json",
      JSON.stringify(
        Object.values(byModName).filter((mod) => mod.bases.length),
        null,
        " ",
      ),
    );
  }

  formatDescription(
    descriptions: { description: string; flags?: string[]; language: string }[],
    values: [number, number][],
  ): string {
    if (!descriptions.length || !values.length) return "";

    let description: string;
    if (descriptions.length > 1) {
      const isNegative = values[0][0] < 0 || values[0][1] < 0;

      const canonicalDesc = descriptions.find((d) =>
        d.flags?.includes("canonical_line"),
      );
      const negatedDesc = descriptions.find((d) =>
        d.flags?.includes("negate 1"),
      );

      if (canonicalDesc && negatedDesc) {
        description = isNegative
          ? negatedDesc.description
          : canonicalDesc.description;
      } else {
        description = descriptions[0].description;
      }
    } else {
      description = descriptions[0].description;
    }

    let result = description.replace(/\[([^\]]+)\]/g, (_, content) => {
      const parts = content.split("|");
      return parts[parts.length - 1];
    });

    if (result.includes("{0:+d}")) {
      const [min, max] = values[0];
      return result.replace(
        /\{0:\+d\}/,
        min === max ? `+${min}` : `+(${min}-${max})`,
      );
    }

    if (result.includes(" to ") && values.length === 2) {
      const [minValues, maxValues] = values;
      const suffix = result.split(" to ")[1].replace(/\{\d+\}/g, "");
      return `Adds (${minValues[0]}-${minValues[1]}) to (${maxValues[0]}-${maxValues[1]})${suffix}`;
    }

    result = result.replace(/\{(?:\d+)?(?::[\+]?[d])?\}/g, () => {
      const [min, max] = values[0];
      if (min === max) {
        return `+${Math.abs(min).toString()}`;
      }
      return `+(${Math.abs(min)}-${Math.abs(max)})`;
    });

    return result;
  }

  getStatDescriptions(): Record<
    string,
    Array<{ description: string; language: string; flags?: string }>
  > {
    const lookup: Record<
      string,
      Array<{ description: string; language: string; flags?: string }>
    > = {};

    const sections = [];

    const statFile = fs.readFileSync(
      path.join(
        process.cwd(),
        `./packages/data/poe${this.gameVersion}/files/metadata@statdescriptions@stat_descriptions.${this.gameVersion === 1 ? "txt" : "csd"}`,
      ),
      "utf16le",
    );
    sections.push(...statFile.split(/\n(?=description|no_description)/));

    const mapFile = fs.readFileSync(
      path.join(
        process.cwd(),
        `./packages/data/poe${this.gameVersion}/files/metadata@statdescriptions@map_stat_descriptions.${this.gameVersion === 1 ? "txt" : "csd"}`,
      ),
      "utf16le",
    );
    sections.push(...mapFile.split(/\n(?=description|no_description)/));

    const heistFile = fs.readFileSync(
      path.join(
        process.cwd(),
        `./packages/data/poe${this.gameVersion}/files/metadata@statdescriptions@heist_equipment_stat_descriptions.${this.gameVersion === 1 ? "txt" : "csd"}`,
      ),
      "utf16le",
    );
    sections.push(...heistFile.split(/\n(?=description|no_description)/));

    const sanctumFile = fs.readFileSync(
      path.join(
        process.cwd(),
        `./packages/data/poe${this.gameVersion}/files/metadata@statdescriptions@sanctum_relic_stat_descriptions.${this.gameVersion === 1 ? "txt" : "csd"}`,
      ),
      "utf16le",
    );
    sections.push(...sanctumFile.split(/\n(?=description|no_description)/));

    if (this.gameVersion === 1) {
      const atlasStatFile = fs.readFileSync(
        path.join(
          process.cwd(),
          "./packages/data/poe1/files/metadata@statdescriptions@atlas_stat_descriptions.txt",
        ),
        "utf16le",
      );
      sections.push(...atlasStatFile.split(/\n(?=description|no_description)/));

      console.log(sections[sections.length - 2]);
    }

    for (const section of sections) {
      const lines = section.split("\n");

      const idLine = lines.find((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith("1 ") || trimmed.startsWith("2 ");
      });
      if (!idLine) continue;

      const ids = idLine.trim().slice(2).split(/\s+/).filter(Boolean);
      for (const id of ids) {
        lookup[id] = [];
      }

      let currentLanguage = "English";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("lang")) {
          currentLanguage = line.split('"')[1];
          continue;
        }

        const match = line.match(/"([^"]+)"/);
        if (match) {
          const fullLine = line;
          const description = match[1];
          const afterQuote = fullLine
            .slice(
              fullLine.indexOf(`"${description}"`) + description.length + 2,
            )
            .trim();

          for (const id of ids) {
            lookup[id].push({
              description,
              language: currentLanguage,
              flags: afterQuote || undefined,
            });
          }
        }
      }
    }

    return lookup;
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

  async collectInheritsFromFiles(
    initialBases: typeof basesV2,
  ): Promise<Set<string>> {
    const inheritsFroms = new Set<string>();
    const processed = new Set<string>();

    for (const base of initialBases) {
      await this.recursivelyFetchInheritsFromFiles(
        base.InheritsFrom,
        inheritsFroms,
        processed,
      );
    }

    return inheritsFroms;
  }

  async recursivelyFetchInheritsFromFiles(
    filePath: string,
    inheritsFroms: Set<string>,
    processed: Set<string>,
  ) {
    if (processed.has(filePath) || filePath === "nothing") return;

    inheritsFroms.add(filePath);
    processed.add(filePath);

    await exportFiles(
      [`${filePath}.it`.toLowerCase()],
      path.join(process.cwd(), `packages/data/poe${this.gameVersion}/files`),
      this.loader,
      this.gameVersion,
    );

    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        `packages/data/poe${this.gameVersion}/files`,
        `${filePath}.it`.toLowerCase().replaceAll("/", "@"),
      ),
      "utf16le",
    );

    const config = this.parseItFile(content);

    if (config.extends) {
      await this.recursivelyFetchInheritsFromFiles(
        config.extends,
        inheritsFroms,
        processed,
      );
    }
  }
}

