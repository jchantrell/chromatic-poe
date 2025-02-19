import visuals from "./poe1/tables/English/ItemVisualIdentity.json";
import classes from "./poe1/tables/English/ItemClasses.json";
import classCategories from "./poe1/tables/English/ItemClassCategories.json";
import bases from "./poe1/tables/English/BaseItemTypes.json";
import tradeCategories from "./poe1/tables/English/TradeMarketCategory.json";
import tradeGroups from "./poe1/tables/English/TradeMarketCategoryGroups.json";
import armourTypes from "./poe1/tables/English/ArmourTypes.json";
import weaponTypes from "./poe1/tables/English/WeaponTypes.json";
import skillGems from "./poe1/tables/English/SkillGems.json";
import gemTags from "./poe1/tables/English/GemTags.json";
import gemEffects from "./poe1/tables/English/GemEffects.json";
import exchange from "./poe1/tables/English/CurrencyExchange.json";
import exchangeCategory from "./poe1/tables/English/CurrencyExchangeCategories.json";
import currencyItems from "./poe1/tables/English/CurrencyItems.json";
import minimapIcons from "./poe1/tables/English/MinimapIcons.json";
import words from "./poe1/tables/English/Words.json";
import uniqueStashLayout from "./poe1/tables/English/UniqueStashLayout.json";
import uniqueStashTypes from "./poe1/tables/English/UniqueStashTypes.json";
import tags from "./poe1/tables/English/Tags.json";
import mods from "./poe1/tables/English/Mods.json";
import modTypes from "./poe1/tables/English/ModType.json";
import stats from "./poe1/tables/English/Stats.json";

import visualsV2 from "./poe2/tables/English/ItemVisualIdentity.json";
import classesV2 from "./poe2/tables/English/ItemClasses.json";
import classCategoriesV2 from "./poe2/tables/English/ItemClassCategories.json";
import basesV2 from "./poe2/tables/English/BaseItemTypes.json";
import tradeCategoriesV2 from "./poe2/tables/English/TradeMarketCategory.json";
import tradeGroupsV2 from "./poe2/tables/English/TradeMarketCategoryGroups.json";
import armourTypesV2 from "./poe2/tables/English/ArmourTypes.json";
import weaponTypesV2 from "./poe2/tables/English/WeaponTypes.json";
import skillGemsV2 from "./poe2/tables/English/SkillGems.json";
import gemTagsV2 from "./poe2/tables/English/GemTags.json";
import gemEffectsV2 from "./poe2/tables/English/GemEffects.json";
import exchangeV2 from "./poe2/tables/English/CurrencyExchange.json";
import exchangeCategoryV2 from "./poe2/tables/English/CurrencyExchangeCategories.json";
import attributeRequirementsV2 from "./poe2/tables/English/AttributeRequirements.json";
import currencyItemsV2 from "./poe2/tables/English/CurrencyItems.json";
import minimapIconsV2 from "./poe2/tables/English/MinimapIcons.json";
import wordsV2 from "./poe2/tables/English/Words.json";
import uniqueStashLayoutV2 from "./poe2/tables/English/UniqueStashLayout.json";
import uniqueStashTypesV2 from "./poe2/tables/English/UniqueStashTypes.json";
import tagsV2 from "./poe2/tables/English/Tags.json";
import modsV2 from "./poe2/tables/English/Mods.json";
import modTypesV2 from "./poe2/tables/English/ModType.json";
import goldModPricesV2 from "./poe2/tables/English/GoldModPrices.json";
import statsV2 from "./poe2/tables/English/Stats.json";

import Database, { type Database as IDatabase } from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { extractMinimapIcons as extractMinimapIconsV2 } from "./minimap";
import { FileLoader } from "./loader";
import { BundleIndex } from "./bundle";
import { exportFiles } from "./file";
import { extractSounds as extractSoundsV2 } from "./sound";

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

enum Tables {
  BASES = "bases",
  VISUALS = "visuals",
  CLASSES = "classes",
  CLASS_CATEGORIES = "class_categories",
  TRADE_GROUPS = "trade_groups",
  TRADE_CATEGORIES = "trade_categories",
  EXCHANGE = "exchange",
  EXCHANGE_CATEGORY = "exchange_category",
  SKILL_GEMS = "skill_gems",
  GEM_EFFECTS = "gem_effects",
  GEM_TAGS = "gem_tags",
  ARMOUR_TYPES = "armour_types",
  WEAPON_TYPES = "weapon_types",
  CURRENCY_ITEMS = "currency_items",
  WORDS = "words",
  UNIQUE_STASH_LAYOUT = "unique_stash_layout",
  UNIQUE_STASH_TYPES = "unique_stash_types",

  BASES_V2 = "bases_v2",
  VISUALS_V2 = "visuals_v2",
  CLASSES_V2 = "classes_v2",
  CLASS_CATEGORIES_V2 = "class_categories_v2",
  TRADE_GROUPS_V2 = "trade_groups_v2",
  TRADE_CATEGORIES_V2 = "trade_categories_v2",
  EXCHANGE_V2 = "exchange_v2",
  EXCHANGE_CATEGORY_V2 = "exchange_category_v2",
  SKILL_GEMS_V2 = "skill_gems_v2",
  GEM_EFFECTS_V2 = "gem_effects_v2",
  GEM_TAGS_V2 = "gem_tags_v2",
  ARMOUR_TYPES_V2 = "armour_types_v2",
  WEAPON_TYPES_V2 = "weapon_types_v2",
  ATTRIBUTE_REQUIREMENTS_V2 = "attribute_requirements_v2",
  CURRENCY_ITEMS_V2 = "currency_items_v2",
  WORDS_V2 = "words_v2",
  UNIQUE_STASH_LAYOUT_V2 = "unique_stash_layout_v2",
  UNIQUE_STASH_TYPES_V2 = "unique_stash_types_v2",
}

const PK = "_index";

const ITEM_CLASS_BLACKLIST = [
  "LabyrinthTrinket",
  "MiscMapItem",
  "Leaguestone",
  "LabyrinthItem",
  "PantheonSoul",
  "UniqueFragment",
  "IncursionItem",
  "MetamorphosisDNA",
  "HideoutDoodad",
  "LabyrinthMapItem",
  "Incubator",
  "Microtransaction",
  "HarvestInfrastructure",
  "HarvestSeed",
  "HarvestPlantBooster",
  "Trinket",
  "HeistObjective",
  "HiddenItem",
  "ArchnemesisMod",
];

const MODIFIABLE_CLASSES = [
  "Life Flasks",
  "Mana Flasks",
  "Utility Flasks",
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

  async extract(config: Config) {
    await this.init(config);

    if (this.gameVersion === 1) {
      return this.extractV1();
    }

    if (this.gameVersion === 2) {
      return this.extractV2();
    }
  }

  async extractV1() {
    await this.populateDB();
  }

  async extractV2() {
    await this.extractItemsV2();
    await this.extractModsV2();
    extractMinimapIconsV2(
      minimapIconsV2,
      "./packages/assets/poe2/minimap.json",
    );
    extractSoundsV2("./packages/data/poe2/sounds.json");
  }

  async populateDB() {
    console.log("Populating DB with dat files...");

    if (this.gameVersion === 1) {
      this.createDBTable(Tables.CURRENCY_ITEMS, currencyItems);
      this.createDBTable(Tables.WEAPON_TYPES, weaponTypes);
      this.createDBTable(Tables.ARMOUR_TYPES, armourTypes);
      this.createDBTable(Tables.VISUALS, visuals);
      this.createDBTable(Tables.BASES, bases);
      this.createDBTable(Tables.CLASSES, classes);
      this.createDBTable(Tables.CLASS_CATEGORIES, classCategories);
      this.createDBTable(Tables.TRADE_CATEGORIES, tradeCategories);
      this.createDBTable(Tables.TRADE_GROUPS, tradeGroups);
      this.createDBTable(Tables.EXCHANGE, exchange);
      this.createDBTable(Tables.EXCHANGE_CATEGORY, exchangeCategory);
      this.createDBTable(Tables.SKILL_GEMS, skillGems);
      this.createDBTable(Tables.GEM_TAGS, gemTags);
      this.createDBTable(Tables.GEM_EFFECTS, gemEffects);
      this.createDBTable(Tables.WORDS, words);
      this.createDBTable(Tables.UNIQUE_STASH_LAYOUT, uniqueStashLayout);
      this.createDBTable(Tables.UNIQUE_STASH_TYPES, uniqueStashTypes);
    }

    if (this.gameVersion === 2) {
      this.createDBTable(Tables.CURRENCY_ITEMS_V2, currencyItemsV2);
      this.createDBTable(Tables.WEAPON_TYPES_V2, weaponTypesV2);
      this.createDBTable(Tables.ARMOUR_TYPES_V2, armourTypesV2);
      this.createDBTable(Tables.VISUALS_V2, visualsV2);
      this.createDBTable(Tables.BASES_V2, basesV2);
      this.createDBTable(Tables.CLASSES_V2, classesV2);
      this.createDBTable(Tables.CLASS_CATEGORIES_V2, classCategoriesV2);
      this.createDBTable(Tables.TRADE_CATEGORIES_V2, tradeCategoriesV2);
      this.createDBTable(Tables.TRADE_GROUPS_V2, tradeGroupsV2);
      this.createDBTable(Tables.EXCHANGE_V2, exchangeV2);
      this.createDBTable(Tables.EXCHANGE_CATEGORY_V2, exchangeCategoryV2);
      this.createDBTable(Tables.SKILL_GEMS_V2, skillGemsV2);
      this.createDBTable(Tables.GEM_TAGS_V2, gemTagsV2);
      this.createDBTable(Tables.GEM_EFFECTS_V2, gemEffectsV2);
      this.createDBTable(
        Tables.ATTRIBUTE_REQUIREMENTS_V2,
        attributeRequirementsV2,
      );
      this.createDBTable(Tables.WORDS_V2, wordsV2);
      this.createDBTable(Tables.UNIQUE_STASH_LAYOUT_V2, uniqueStashLayoutV2);
      this.createDBTable(Tables.UNIQUE_STASH_TYPES_V2, uniqueStashTypesV2);
    }
  }

  generateInsertStmt(table: string, keys: string[]) {
    return `INSERT INTO ${table}(${keys}) VALUES(${keys.map((key) => `@${key}`)})`;
  }

  async createDBTable(
    name: string,
    records: { [key: string]: string | number | boolean | null | number[] }[],
  ) {
    const fields = new Map<string, string>();
    for (const record of records) {
      for (const [key, value] of Object.entries(record)) {
        if (key === PK) continue;
        if (key === "Group") {
          // dumb hack to avoid reserved word in SQL
          fields.set("Grouping", "INTEGER");
          continue;
        }
        if (typeof value === "string") {
          fields.set(key, "TEXT");
        }
        if (typeof value === "number") {
          fields.set(key, "INTEGER");
        }
        if (typeof value === "boolean") {
          fields.set(key, "INTEGER");
        }
        if (Array.isArray(value)) {
          fields.set(key, "TEXT");
        }
      }
    }

    for (const [key] of Object.entries(records[0])) {
      if (!fields.has(key) && key !== "Group") {
        fields.set(key, "INTEGER");
      }
    }

    const query = `CREATE TABLE IF NOT EXISTS ${name} (pk INTEGER PRIMARY KEY AUTOINCREMENT, ${Array.from(fields).map(([key, type]) => `${key} ${type}`)})`;
    this.db.exec(query);
    const stmt = this.generateInsertStmt(
      name,
      Array.from(fields).flatMap(([key]) => key),
    );
    const insert = this.db.prepare(stmt);
    this.db.transaction((entries: typeof records) => {
      for (const entry of entries) {
        insert.run(entry);
      }
    })(
      records.map((entry) => {
        for (const [key, value] of Object.entries(entry)) {
          if (Array.isArray(value)) {
            entry[key] = JSON.stringify(value);
          }
          if (typeof value === "boolean") {
            entry[key] = value ? 1 : 0;
          }
          if (key === "Group") {
            // dumb hack to avoid reserved word in SQL
            entry.Grouping = value;
            delete entry.Group;
          }
        }
        return entry;
      }),
    );
  }

  async queryWiki(
    offset: number,
    results: unknown[],
  ): Promise<{ name: string; base: string }[]> {
    const req = await fetch(
      `https://www.poe${this.gameVersion === 2 ? "2" : ""}wiki.net/w/api.php?action=cargoquery&tables=items&fields=items.name,items.base_item&where=items.rarity=%22Unique%22&format=json&offset=${offset}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
    const res = await req.json();
    if (res.cargoquery.length) {
      return this.queryWiki(offset + 50, [...results, ...res.cargoquery]);
    }

    return [...results, ...res.cargoquery].map(({ title }) => ({
      name: title.name,
      base: title["base item"],
    }));
  }

  async extractItemsV2() {
    await this.populateDB();
    console.log("Querying DB for items...");

    const extraFields = `
art,
height,
width,
gemFx,
class as itemClass,
name as base
`;

    const items = this.db
      .prepare(`
WITH ITEMS AS (

SELECT DISTINCT
${Tables.BASES_V2}.Name as 'name',
${Tables.CLASSES_V2}.Name as 'class',
${Tables.CLASS_CATEGORIES_V2}.Text as 'category',
${Tables.VISUALS_V2}.DDSFile as 'art',
${Tables.TRADE_CATEGORIES_V2}.Name as 'tradeCategory',
${Tables.TRADE_GROUPS_V2}.Name as 'tradeGroup',
exchange_major.Name as 'exchangeCategory',
exchange_sub.Name as 'exchangeSubCategory',

${Tables.EXCHANGE_V2}.GoldPurchaseFee as 'price',
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS_V2}.ReqStr,
  ${Tables.SKILL_GEMS_V2}.StrengthRequirementPercent
) as 'strReq',
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS_V2}.ReqDex,
  ${Tables.SKILL_GEMS_V2}.DexterityRequirementPercent
) as 'dexReq',
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS_V2}.ReqInt,
  ${Tables.SKILL_GEMS_V2}.IntelligenceRequirementPercent
) as 'intReq',

${Tables.ARMOUR_TYPES_V2}.Armour as 'armour',
${Tables.ARMOUR_TYPES_V2}.Evasion as 'evasion',
${Tables.ARMOUR_TYPES_V2}.EnergyShield as 'energyShield',
${Tables.ARMOUR_TYPES_V2}.Ward as 'ward',

${Tables.WEAPON_TYPES_V2}.DamageMin as 'dmgMin',
${Tables.WEAPON_TYPES_V2}.DamageMax as 'dmgMax',
${Tables.WEAPON_TYPES_V2}.Speed as 'speed',

${Tables.BASES_V2}.Height as 'height',
${Tables.BASES_V2}.Width as 'width',
${Tables.BASES_V2}.SiteVisibility as 'active',

${Tables.CLASSES_V2}.CanBeCorrupted as corruptable,
(CASE
  WHEN ${Tables.CURRENCY_ITEMS_V2}.StackSize IS NOT NULL
  AND ${Tables.CURRENCY_ITEMS_V2}.StackSize > 1
  THEN 1
  ELSE 0
END) as stackable,

${Tables.SKILL_GEMS_V2}.GemEffects as 'gemFx',
${Tables.BASES_V2}.DropLevel as 'dropLevel'

FROM ${Tables.BASES_V2}

LEFT JOIN ${Tables.CLASSES_V2}
ON ${Tables.BASES_V2}.ItemClass = ${Tables.CLASSES_V2}.${PK}

LEFT JOIN ${Tables.CLASS_CATEGORIES_V2}
ON ${Tables.CLASSES_V2}.ItemClassCategory = ${Tables.CLASS_CATEGORIES_V2}.${PK}

LEFT JOIN ${Tables.VISUALS_V2}
ON ${Tables.BASES_V2}.ItemVisualIdentity = ${Tables.VISUALS_V2}.${PK}

LEFT JOIN ${Tables.TRADE_CATEGORIES_V2}
ON ${Tables.BASES_V2}.TradeMarketCategory = ${Tables.TRADE_CATEGORIES_V2}.${PK}
OR ${Tables.CLASSES_V2}.TradeMarketCategory = ${Tables.TRADE_CATEGORIES_V2}.${PK}

LEFT JOIN ${Tables.TRADE_GROUPS_V2}
ON ${Tables.TRADE_CATEGORIES_V2}.Grouping = ${Tables.TRADE_GROUPS_V2}.${PK}

LEFT JOIN ${Tables.EXCHANGE_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.EXCHANGE_V2}.Item

LEFT JOIN ${Tables.EXCHANGE_CATEGORY_V2} as exchange_major
ON ${Tables.EXCHANGE_V2}.Category = exchange_major.${PK}

LEFT JOIN ${Tables.EXCHANGE_CATEGORY_V2} as exchange_sub
ON ${Tables.EXCHANGE_V2}.SubCategory = exchange_sub.${PK}

LEFT JOIN ${Tables.ATTRIBUTE_REQUIREMENTS_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.ATTRIBUTE_REQUIREMENTS_V2}.BaseItemType

LEFT JOIN ${Tables.ARMOUR_TYPES_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.ARMOUR_TYPES_V2}.BaseItemType

LEFT JOIN ${Tables.WEAPON_TYPES_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.WEAPON_TYPES_V2}.BaseItemType

LEFT JOIN ${Tables.SKILL_GEMS_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.SKILL_GEMS_V2}.BaseItemType

LEFT JOIN ${Tables.CURRENCY_ITEMS_V2}
ON ${Tables.BASES_V2}.${PK} = ${Tables.CURRENCY_ITEMS_V2}.BaseItemType

WHERE ${Tables.BASES_V2}.Name != '' AND ${Tables.BASES_V2}.Name IS NOT NULL
)

-- Weapons
SELECT DISTINCT
name,
'Weapons' AS category,
tradeCategory AS class,
null as type,
(dmgMin + dmgMax) / 2 * (1000 / speed) AS score,
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('One Handed Weapons', 'Two Handed Weapons')

UNION ALL

-- Offhands
SELECT DISTINCT
name,
'Off-hands' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  WHEN tradeCategory in ('Quivers')
  THEN 'Dexterity'
  ELSE 'Unknown'
END) AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('Off-hand') OR class = 'Foci'

UNION ALL

-- Armour
SELECT DISTINCT
name,
'Armour' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0 AND energyShield != 0
  THEN 'Miscellaneous'
  WHEN ward != 0
  THEN 'Ward'
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN evasion != 0 AND energyShield != 0
  THEN 'Dexterity/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  ELSE 'Miscellaneous'
END) AS type,
armour + evasion + energyShield + ward AS score, 
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('Armour')
AND ((name LIKE 'Expert %' OR name LIKE 'Advanced %') OR dropLevel < 45)

UNION ALL

-- Jewellery
SELECT DISTINCT
name,
'Jewellery' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('Jewellery')

UNION ALL

-- Flasks
SELECT DISTINCT
name,
'Flasks' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('Flasks') AND class != 'Charms'

UNION ALL

-- Charms
SELECT DISTINCT
name,
'Charms' AS category,
(CASE
  WHEN name IN ('Thawing Charm', 'Shivering Charm', 'Antidote Charm', 'Dousing Charm', 'Grounding Charm', 'Stone Charm', 'Silver Charm', 'Staunching Charm')
  THEN 'Ailment'
  WHEN name IN ('Ruby Charm', 'Sapphire Charm', 'Topaz Charm', 'Amethyst Charm')
  THEN 'Resist'
  ELSE 'Other'
END) as class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Charms'

UNION ALL

-- Gems
SELECT DISTINCT
name,
'Gems' AS category,
class,
(CASE
  WHEN strReq != 0 AND dexReq != 0 AND intReq != 0
  THEN 'Hybrid'
  WHEN strReq != 0 AND dexReq != 0
  THEN 'Strength/Dexterity'
  WHEN strReq != 0 AND intReq != 0
  THEN 'Strength/Intelligence'
  WHEN intReq != 0 AND dexReq != 0
  THEN 'Dexterity/Intelligence'
  WHEN strReq != 0
  THEN 'Strength'
  WHEN dexReq != 0
  THEN 'Dexterity'
  WHEN intReq != 0
  THEN 'Intelligence'
  ELSE 'Unknown'
END) as type,
strReq + dexReq + intReq AS score, 
${extraFields}
FROM ITEMS
WHERE tradeGroup IN ('Gems') AND name NOT LIKE '[DNT]%' AND name NOT IN ('Coming Soon', 'Shroud')

UNION ALL

SELECT DISTINCT
name,
'Gems' AS category,
'Uncut' AS class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Uncut Skill Gem', 'Uncut Support Gem', 'Uncut Spirit Gem')

UNION ALL

-- Jewels
SELECT DISTINCT
name,
'Jewels' AS category,
class,
(CASE
  WHEN name LIKE 'Time-Lost%'
  THEN 'Special'
  WHEN name LIKE 'Timeless%'
  THEN 'Special'
  ELSE 'Common'
END) as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Jewels'

UNION ALL

-- Maps
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Waystones'

UNION ALL

-- Tablets
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Tablet'

UNION ALL

-- Currency, Essence, Runes
SELECT DISTINCT
name,
exchangeCategory AS category,
(CASE
  WHEN exchangeSubcategory = exchangeCategory
  THEN 'Common'
  ELSE exchangeSubcategory
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Essences', 'Currency', 'Runes')

UNION ALL

-- Special cased currency
SELECT DISTINCT
name,
'Currency' AS category,
'Common' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Albino Rhoa Feather')

UNION ALL

-- Expedition
SELECT DISTINCT
name,
'Expedition' AS category,
'Logbook' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Expedition Logbooks'

UNION ALL

SELECT DISTINCT
name,
'Expedition' AS category,
'Currency' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Exotic Coinage', 'Sun Artifact', 'Broken Circle Artifact', 'Black Scythe Artifact', 'Order Artifact')


UNION ALL

-- Ultimatum
SELECT DISTINCT
name,
'Ultimatum' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeSubcategory = 'Ultimatum Fragments'
OR class = 'Inscribed Ultimatum'

UNION ALL

SELECT DISTINCT
name,
'Ultimatum' AS category,
'Soul Cores' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Soul Cores'

UNION ALL

-- Sekhema
SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Trial Coins'

UNION ALL

SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Relics'

UNION ALL

SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
'Keys' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Gold Key', 'Silver Key', 'Bronze Key')

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'An Audience with the King'

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Omen'

UNION ALL

-- Delirium, Breach
SELECT DISTINCT
name,
exchangeCategory AS category,
(CASE
  WHEN exchangeSubcategory = exchangeCategory
  THEN 'Fragments'
  ELSE exchangeSubcategory
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Delirium', 'Breach')

UNION ALL

SELECT DISTINCT
name,
'Currency' AS category,
'Common' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'Gold'

UNION ALL

-- Boss Fragments
SELECT DISTINCT
name,
'Pinnacle' AS category,
'Fragments' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeSubcategory IN ('Pinnacle Fragments')

UNION ALL

-- Vault Keys
SELECT DISTINCT
name,
'Currency' AS category,
'Vault Keys' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Vault Keys'
`)

      .all();

    const uniques = this.db
      .prepare(`
SELECT DISTINCT
${Tables.WORDS_V2}.Text as name,
'Uniques' as category,
${Tables.UNIQUE_STASH_TYPES_V2}.Name as class,
null as type,
0 AS score, 
${Tables.VISUALS_V2}.DDSFile as art,
null as height,
null as width,
null as gemFx,
null as itemClass
FROM ${Tables.UNIQUE_STASH_LAYOUT_V2}
LEFT JOIN ${Tables.UNIQUE_STASH_TYPES_V2}
ON ${Tables.UNIQUE_STASH_LAYOUT_V2}.UniqueStashTypesKey = ${Tables.UNIQUE_STASH_TYPES_V2}.${PK}
LEFT JOIN ${Tables.WORDS_V2}
ON ${Tables.UNIQUE_STASH_LAYOUT_V2}.WordsKey = ${Tables.WORDS_V2}.${PK}
LEFT JOIN ${Tables.VISUALS_V2}
ON ${Tables.UNIQUE_STASH_LAYOUT_V2}.ItemVisualIdentityKey = ${Tables.VISUALS_V2}.${PK}
WHERE ${Tables.WORDS_V2}.Text NOT IN ('Sekhema''s Resolve Fire', 'Sekhema''s Resolve Cold', 'Sekhema''s Resolve Lightning', 'The Wailing Wall', 'The Road Warrior', 'The Immortan')
`)
      .all();

    const uniqueOverrides = [
      {
        name: "The Road Warrior",
        category: "Uniques",
        class: "Body Armour",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Body Armour",
        art: "Art/2DItems/Armours/BodyArmours/Uniques/TheRoadWarrior.dds",
        base: "Raider Plate",
      },
      {
        name: "The Wailing Wall",
        category: "Uniques",
        class: "Shield",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Shields",
        art: "Art/2DItems/Offhand/Shields/Uniques/TheWailingWall.dds",
        base: "Effigial Tower Shield",
      },
      {
        name: "Strugglescream",
        category: "Uniques",
        class: "Amulet",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Amulets",
        art: "Art/2DItems/Amulets/Uniques/DeliriumAmulet.dds",
      },
      {
        name: "The Peacemaker's Draught",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique1x3.dds",
      },
      {
        name: "The Desperate Alliance",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique1x4.dds",
      },
      {
        name: "The Changing Seasons",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique2x1.dds",
      },
      {
        name: "The Remembered Tales",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique2x2.dds",
      },
      {
        name: "The Burden of Leadership",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique3x1.dds",
      },
      {
        name: "The Last Flame",
        category: "Uniques",
        class: "Relics",
        type: null,
        score: 0,
        height: null,
        width: null,
        gemFx: null,
        itemClass: "Relics",
        art: "Art/2DItems/Relics/RelicUnique4x1.dds",
      },
    ];

    const allUniques = [...uniques, ...uniqueOverrides] as Item[];
    const allItems = [...allUniques, ...items] as Item[];

    await exportFiles(
      ["art/2dart/minimap/player.png", ...allItems.map((item) => item.art)],
      path.join(process.cwd(), "packages/assets/poe2/images"),
      this.loader,
    );

    console.log("Querying wiki for unique bases...");
    const wikiUniques = await this.queryWiki(0, []);
    for (const unique of allUniques) {
      if (unique.base) continue;
      const entry = wikiUniques.find((entry) => entry.name === unique.name);
      if (entry) {
        unique.base = entry.base;
      } else {
        console.warn(`Missed base for ${unique.name}`);
      }
    }

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      if (!item.art) {
        console.warn(`Missed art for ${item.name}`, item);
        allItems[i] = undefined;
        continue;
      }

      const replacedFilepath = `poe2/images/${item.art.replaceAll("/", "@").replace("dds", "png")}`;
      item.art = replacedFilepath;

      if (item.class === "Shield") {
        item.class = "Shields";
      }

      if (item.class === "Skill Gems") {
        const effectIds = JSON.parse(item.gemFx);
        for (const effect of effectIds) {
          const tagIds = JSON.parse(gemEffectsV2[effect].GemTags);
          for (const tagId of tagIds) {
            const tag = gemTagsV2[tagId];
            if (tag.Id === "buff") {
              item.class = "Spirit Gems";
            }
          }
        }
      }
      delete item.gemFx;
    }

    console.log("Writing item file...");
    fs.writeFileSync(
      "./packages/data/poe2/items.json",
      JSON.stringify(allItems, null, " "),
    );
  }

  async extractModsV2() {
    const extraFiles = ["metadata/statdescriptions/stat_descriptions.csd"];
    await exportFiles(
      extraFiles,
      path.join(process.cwd(), "packages/data/poe2/files"),
      this.loader,
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
    const statFile = fs.readFileSync(
      path.join(
        process.cwd(),
        "./packages/data/poe2/files/metadata@statdescriptions@stat_descriptions.csd",
      ),
      "utf16le",
    );

    const lookup: Record<
      string,
      Array<{ description: string; language: string; flags?: string }>
    > = {};

    const sections = statFile.split(/\n(?=description|no_description)/);

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
      path.join(process.cwd(), "packages/data/poe2/files"),
      this.loader,
    );

    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        "packages/data/poe2/files",
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

(async () => {
  const dat = new DatFiles();

  const poe1Config = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "/packages/data/poe1/config.json"),
      "utf8",
    ),
  );
  const poe2Config = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "/packages/data/poe2/config.json"),
      "utf8",
    ),
  );

  await dat.extract(poe1Config);
  await dat.extract(poe2Config);
})();
