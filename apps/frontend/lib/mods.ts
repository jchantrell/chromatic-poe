import Fuse, { type FuseResult } from "fuse.js";
import { BundleManager } from "./bundle";
import { Database } from "./db";
import { IDBManager } from "./idb";

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
  type?: string;
  position?: "prefix" | "suffix" | "affix";
  bases?: string[];
  stats: ModStats[][];
  domain?: number;
  ids?: string[];
  weights?: number[];
  [key: string]: unknown;
}

export interface SingleMod extends Omit<Mod, 'stats'> {
  stats: ModStats[];
}

export interface SearchableMod extends Mod {
  searchStats: ModStats[];
}

export class ModManager {
  constructor(
    private loader: BundleManager,
    private idb: IDBManager,
    private db: Database
  ) {}

  async getMods(patch: string) {
    const db = await this.idb.getInstance();
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const key = `${gameVersion}/mods`;
    return await db.get("mods", key);
  }

  async extract(patch: string, onProgress?: (percent: number, msg: string) => void) {
    if (onProgress) onProgress(0, "Fetching stat descriptions...");
    console.log("Extracting mods...");
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    
    // 1. Fetch and Parse Stat Descriptions
    const statDescriptions = await this.getStatDescriptions(gameVersion);

    if (onProgress) onProgress(10, "Resolving base items...");

    // 2. Resolve Base Item Tags (Inheritance)
    const itemClassCol = gameVersion === 1 ? "ItemClassesKey" : "ItemClass";
    const tagsCol = gameVersion === 1 ? "TagsKeys" : "Tags";
    const baseItems = await this.db.query(`SELECT Name, ${itemClassCol}, ${tagsCol}, InheritsFrom, ModDomain FROM "${patch}_BaseItemTypes"`);
    const tagsTable = await this.db.query(`SELECT _index, Id FROM "${patch}_Tags"`);
    const tagsMap = Object.fromEntries(tagsTable.map((t: any) => [t._index, t.Id]));
    
    const itemClasses = await this.db.query(`SELECT _index, Name FROM "${patch}_ItemClasses"`);
    const classesMap = Object.fromEntries(itemClasses.map((t: any) => [t._index, t.Name]));


    const hierarchy = await this.buildHierarchy(baseItems, gameVersion);

    if (onProgress) onProgress(20, "Processing mods...");

    // 3. Process Mods
    const modsTable = await this.db.query(`SELECT * FROM "${patch}_Mods"`);
    const statsTable = await this.db.query(`SELECT _index, Id FROM "${patch}_Stats"`);
    const statsMap = Object.fromEntries(statsTable.map((s: any) => [s._index, s]));
    
    const modTypes = await this.db.query(`SELECT _index, Name FROM "${patch}_ModType"`);
    const modTypesMap = Object.fromEntries(modTypes.map((t: any) => [t._index, t.Name]));

    let itemMods: Record<string, SingleMod>;

    if (gameVersion === 2) {
        itemMods = await this.extractPoE2(patch, statDescriptions, hierarchy, baseItems, tagsMap, classesMap, modsTable, statsMap, modTypesMap);
    } else {
        itemMods = await this.extractPoE1(patch, statDescriptions, hierarchy, baseItems, tagsMap, classesMap, modsTable, statsMap, modTypesMap);
    }
    
    if (onProgress) onProgress(80, "Grouping and saving mods...");

    // Group by name and save
     const byModName: Record<
      string,
      {
        type: string;
        name: string;
        id: string;
        label: string;
        position: "prefix" | "suffix" | "affix";
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

    const finalMods = Object.values(byModName).filter((mod) => mod.bases.length);

    const db = await this.idb.getInstance();
    const key = `${gameVersion}/mods`;
    await db.put("mods", finalMods, key);
    return finalMods;
  }
  
  async getStatDescriptions(gameVersion: number) {
     const ext = gameVersion === 1 ? "txt" : "csd";
     const files = [
        `metadata/statdescriptions/stat_descriptions.${ext}`,
        `metadata/statdescriptions/map_stat_descriptions.${ext}`,
        `metadata/statdescriptions/heist_equipment_stat_descriptions.${ext}`,
        `metadata/statdescriptions/sanctum_relic_stat_descriptions.${ext}`,
     ];
     
     if (gameVersion === 1) {
         files.push("metadata/statdescriptions/atlas_stat_descriptions.txt");
     }
     
     const lookup: Record<string, Array<{ description: string; language: string; flags?: string }>> = {};

     for (const filePath of files) {
         try {
             const contentUint8 = await this.loader.getFileContents(filePath);
             const decoder = new TextDecoder("utf-16le");
             const content = decoder.decode(contentUint8);
             this.parseStatDescriptionFile(content, lookup);
         } catch (e) {
             console.warn(`Failed to load stat description: ${filePath}`, e);
         }
     }
     
     return lookup;
  }

  parseStatDescriptionFile(content: string, lookup: Record<string, any[]>) {
      const sections = content.split(/\n(?=description|no_description)/);
      
       for (const section of sections) {
          const lines = section.split("\n");

          const idLine = lines.find((line) => {
            const trimmed = line.trim();
            return trimmed.startsWith("1 ") || trimmed.startsWith("2 ") || trimmed.startsWith("3 ") || trimmed.startsWith("4 ");
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
  
  async buildHierarchy(baseItems: any[], gameVersion: number): Promise<ItFileHierarchy> {
      const inheritsFroms = new Set<string>();
      const processed = new Set<string>();
      
      for (const base of baseItems) {
           if (base.InheritsFrom) {
               await this.recursivelyFetchInheritsFromFiles(base.InheritsFrom, inheritsFroms, processed, gameVersion);
           }
      }
      
      const hierarchy: ItFileHierarchy = {};
      for (const inheritsFrom of inheritsFroms) {
          const pathName = `${inheritsFrom}.it`.toLowerCase(); 
          try {
              const contentUint8 = await this.loader.getFileContents(pathName);
              const decoder = new TextDecoder("utf-16le");
              const content = decoder.decode(contentUint8);
              hierarchy[inheritsFrom] = this.parseItFile(content);
          } catch(e) {
              console.warn(`Failed to parse .it file: ${pathName}`, e);
          }
      }
      return hierarchy;
  }
  
  async recursivelyFetchInheritsFromFiles(
    filePath: string,
    inheritsFroms: Set<string>,
    processed: Set<string>,
    gameVersion: number
  ) {
    if (processed.has(filePath) || filePath === "nothing") return;

    inheritsFroms.add(filePath);
    processed.add(filePath);
    
    try {
        const pathName = `${filePath}.it`.toLowerCase();
        const contentUint8 = await this.loader.getFileContents(pathName);
        const decoder = new TextDecoder("utf-16le");
        const content = decoder.decode(contentUint8);
        const def = this.parseItFile(content);
        
        if (def.extends) {
             await this.recursivelyFetchInheritsFromFiles(def.extends, inheritsFroms, processed, gameVersion);
        }
    } catch (e) {}
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
  
  // Placeholder extraction methods to be filled
  async extractPoE1(
    patch: string,
    statDescriptions: any,
    hierarchy: ItFileHierarchy,
    baseItems: any[],
    tagsMap: any,
    classesMap: any,
    modsTable: any[],
    statsMap: any,
    modTypesMap: any
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
      
      if (!mod.Name || !ids.length) continue;

      const implicitTagKeys = Array.isArray(mod.ImplicitTagsKeys)
          ? mod.ImplicitTagsKeys
          : JSON.parse(mod.ImplicitTagsKeys as string);
          
      const affixTags = implicitTagKeys
        .map((key: number) => tagsMap[key])
        .filter((tag: string) => tag && !tag.endsWith("_damage"));

      const position =
        mod.GenerationType === 1
          ? "prefix"
          : mod.GenerationType === 2
            ? "suffix"
            : "affix";

      const allStats: { label: string; description: string }[] = [];
      const statsMapped = [
        mod.StatsKey1,
        mod.StatsKey2,
        mod.StatsKey3,
        mod.StatsKey4,
      ]
        .filter((key) => key !== null && key !== undefined)
        .map((key) => statsMap[key]);

      for (let i = 0; i < statsMapped.length; i++) {
        const stat = statsMapped[i];
        if (!stat) continue;
        
        const nextStat = statsMapped[i + 1];
        const statDescription = statDescriptions[stat.Id];
        const descs = statDescription
          ? statDescription.filter((desc: any) => desc.language === "English")
          : [];

        if (nextStat && i + 1 < statsMapped.length) {
          const currentDesc = descs[0]?.description;

          if (currentDesc?.includes(" to ")) {
            const values: [number, number][] = [
              [mod[`Stat${i + 1}Min`], mod[`Stat${i + 1}Max`]],
              [mod[`Stat${i + 2}Min`], mod[`Stat${i + 2}Max`]],
            ];

            const description = this.formatDescription(descs, values);
            allStats.push({ label: description, description });

            i++;
            continue;
          }
        }

        const values: [number, number][] = [
          [mod[`Stat${i + 1}Min`], mod[`Stat${i + 1}Max`]],
        ];

        const description = this.formatDescription(descs, values);
        allStats.push({ label: description, description });
      }
      
      let typeName = "";
      if (mod.ModTypeKey != null && modTypesMap[mod.ModTypeKey]) {
          typeName = modTypesMap[mod.ModTypeKey].replace(
            /([A-Z])/g,
            (match: string) => `_${match.toLowerCase()}`,
          ).replace(/^_/, "");
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

    // Link Mods to Bases
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
            if (itemMods[mod.id] && !(itemMods[mod.id] as any).bases?.includes(name)) {
                if (!(itemMods[mod.id] as any).bases) (itemMods[mod.id] as any).bases = [];
                (itemMods[mod.id] as any).bases!.push(name);
            }
          }
        }
      }
    }
    
    return itemMods;
  }

  async extractPoE2(
    patch: string,
    statDescriptions: any,
    hierarchy: ItFileHierarchy,
    baseItems: any[],
    tagsMap: any,
    classesMap: any,
    modsTable: any[],
    statsMap: any,
    modTypesMap: any
  ): Promise<Record<string, SingleMod>> {
    const itemMods: Record<string, SingleMod> = {};
    const goldModPricesTable = await this.db.query(`SELECT * FROM "${patch}_GoldModPrices"`);

    for (const intersection of goldModPricesTable) {
        if (!intersection.Mod && intersection.Mod !== 0) continue; // Mod is foreign key to modsTable index? 
        // Legacy: const mod = modsV2[intersection.Mod];
        
        // SQLite: Mods table has _index. 
        // We can optimize by converting modsTable to a map or array access if indices match.
        // Assuming modsTable is an array where index matches _index if sorted.
        // Alternatively, use a map.
        // I'll assume modsTable is array of objects. Creating a map is safer.
        // But modsTable passed to this function is array of all rows.
        
        // Let's create `modsMap` once at start of function?
        // Actually passing it in would be better, but I'll make it here.
    }
    
    // Efficiency: create map of mods by index
    const modsByIndex = new Map(modsTable.map(m => [m._index, m]));
    
    for (const intersection of goldModPricesTable) {
        const mod = modsByIndex.get(intersection.Mod);
        if (!mod) continue;
        
        const tagKeys = Array.isArray(intersection.Tags) 
            ? intersection.Tags 
            : JSON.parse(intersection.Tags as string);
            
        const ids = tagKeys.map((key: number) => tagsMap[key]).filter(Boolean);
        if (!mod.Name || !ids.length) continue;
        
        const implicitTagKeys = Array.isArray(mod.ImplicitTags) // PoE2 uses 'ImplicitTags' not 'ImplicitTagsKeys' ? Legacy says 'ImplicitTags'
          ? mod.ImplicitTags
          : JSON.parse(mod.ImplicitTags as string);
          
        const affixTags = implicitTagKeys
            .map((key: number) => tagsMap[key])
            .filter((tag: string) => tag && !tag.endsWith("_damage"));

        const position =
            mod.GenerationType === 1
            ? "prefix"
            : mod.GenerationType === 2
                ? "suffix"
                : "affix";
        
        const allStats: { label: string; description: string }[] = [];
        const statsMapped = [mod.Stat1, mod.Stat2, mod.Stat3, mod.Stat4]
            .filter((key) => key !== null && key !== undefined)
            .map((key) => statsMap[key]);

        for (let i = 0; i < statsMapped.length; i++) {
            const stat = statsMapped[i];
            if (!stat) continue;
            const nextStat = statsMapped[i + 1];
            const statDescription = statDescriptions[stat.Id];
            const descs = statDescription
            ? statDescription.filter((desc: any) => desc.language === "English")
            : [];

            if (nextStat && i + 1 < statsMapped.length) {
                const currentDesc = descs[0]?.description;
                const nextDescs = statDescriptions[nextStat.Id]?.filter(
                    (desc: any) => desc.language === "English",
                );
                const nextDesc = nextDescs?.[0]?.description;

                if (currentDesc?.includes(" to ") && nextDesc?.includes(" to ")) {
                    // PoE2 values are in StatNValue which is an array [min, max]? 
                    // Legacy: [mod[`Stat${i + 1}Value`][0], mod[`Stat${i + 1}Value`][1]]
                    // But in SQLite `Stat1Value` might be JSON array "[min, max]"
                    // or it might be separate columns? Dat schema usually has arrays for this in PoE2?
                    // Let's check schema/legacy. Legacy: `mod.Stat1Value[0]`
                    // So Stat1Value is an array.
                    
                    const val1 = typeof mod[`Stat${i + 1}Value`] === 'string' ? JSON.parse(mod[`Stat${i + 1}Value`]) : mod[`Stat${i + 1}Value`];
                    const val2 = typeof mod[`Stat${i + 2}Value`] === 'string' ? JSON.parse(mod[`Stat${i + 2}Value`]) : mod[`Stat${i + 2}Value`];
                    
                    const values: [number, number][] = [
                        [val1[0], val1[1]],
                        [val2[0], val2[1]],
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
            
            const val = typeof mod[`Stat${i + 1}Value`] === 'string' ? JSON.parse(mod[`Stat${i + 1}Value`]) : mod[`Stat${i + 1}Value`];
            const values: [number, number][] = [
                [val[0], val[1]],
            ];

            allStats.push({
                label: stat.Text.replace(/\b(Minimum|Maximum|Local)\s+/gi, ""),
                description: descs.length
                    ? this.formatDescription(descs, values)
                    : "",
            });
        }
        
        let typeName = "";
        if (mod.ModType != null && modTypesMap[mod.ModType]) { // ModType not ModTypeKey in PoE2? Legacy says mod.ModType
             typeName = modTypesMap[mod.ModType].replace(
                /([A-Z])/g,
                (match: string) => `_${match.toLowerCase()}`,
            ).replace(/^_/, "");
        }
        
        // Weights come from intersection.SpawnWeight
        const weights = Array.isArray(intersection.SpawnWeight)
            ? intersection.SpawnWeight
            : JSON.parse(intersection.SpawnWeight as string);

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
    
    // Link Mods to Bases (Same logic as PoE1 essentially)
    for (const base of baseItems) {
      if (!base.ItemClass) continue; // ItemClass index in V2
      const className = classesMap[base.ItemClass];
      if (!MODIFIABLE_CLASSES.includes(className)) continue;

      const name = base.Name;
      const extendedTags = this.getAllTags(base.InheritsFrom, hierarchy);
      
      const baseTagKeys = Array.isArray(base.Tags) // Tags not TagsKeys in V2
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
            if (itemMods[mod.id] && !(itemMods[mod.id] as any).bases?.includes(name)) {
                if (!(itemMods[mod.id] as any).bases) (itemMods[mod.id] as any).bases = [];
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
      mods.map((mod) => ({
        ...mod,
        searchStats: mod.stats ? mod.stats.flat() : [],
      })) as SearchableMod[],
    );
  }

  setMods(mods: SearchableMod[]) {
    const options = {
      keys: ["name", "tags", "bases", "searchStats.description"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
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
      console.log("empty search");
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(`'${args}`);
  }
}

export const modIndex = new ModIndex();
