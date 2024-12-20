import visuals from "./poe2/tables/English/ItemVisualIdentity.json";
import classes from "./poe2/tables/English/ItemClasses.json";
import classCategories from "./poe2/tables/English/ItemClassCategories.json";
import bases from "./poe2/tables/English/BaseItemTypes.json";
import tradeCategories from "./poe2/tables/English/TradeMarketCategory.json";
import tradeGroups from "./poe2/tables/English/TradeMarketCategoryGroups.json";
import armourTypes from "./poe2/tables/English/ArmourTypes.json";
import weaponTypes from "./poe2/tables/English/WeaponTypes.json";
import skillGems from "./poe2/tables/English/SkillGems.json";
import exchange from "./poe2/tables/English/CurrencyExchange.json";
import exchangeCategory from "./poe2/tables/English/CurrencyExchangeCategories.json";
import attributeRequirements from "./poe2/tables/English/AttributeRequirements.json";
import minimapIcons from "./poe2/tables/English/MinimapIcons.json";

import Database, { type Database as IDatabase } from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { extractMinimapIcons } from "./minimap";
import { FileLoader } from "./loader";
import { BundleIndex } from "./bundle";
import { exportFiles } from "./file";
import { exportTables } from "./table";

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
  ARMOUR_TYPES = "armour_types",
  WEAPON_TYPES = "weapon_types",
  ATTRIBUTE_REQUIREMENTS = "attribute_requirements",
}

const PK = "_index";

export type Config = {
  patch: string;
  translations: string[];
  tables: { [key: string]: string }[];
};

export class DatFiles {
  gameVersion: 1 | 2;
  config: Config;
  db: IDatabase;
  loader!: FileLoader;
  index!: BundleIndex;

  constructor(patchVer: string) {
    this.db = new Database("chromatic.db", {});
    this.db.pragma("journal_mode = WAL");
    this.loader = new FileLoader(path.join(process.cwd(), "/.cache"), patchVer);
    this.index = new BundleIndex(this.loader);
    this.gameVersion = patchVer.startsWith("4") ? 2 : 1;

    if (this.gameVersion === 1) {
      this.config = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "/packages/data/poe1/config.json"),
          "utf8",
        ),
      );
    } else {
      this.config = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "/packages/data/poe2/config.json"),
          "utf8",
        ),
      );
    }
  }

  async init() {
    await this.loader.init();
    await this.index.loadIndex();
  }

  generateInsertStmt(table: string, keys: string[]) {
    return `INSERT OR REPLACE INTO ${table}(${keys}) VALUES(${keys.map((key) => `@${key}`)})`;
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
            entry.Grouping = value;
            delete entry.Group;
          }
        }
        return entry;
      }),
    );
  }

  async populateDB() {
    console.log("Populating DB with game data...");
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
    this.createDBTable(Tables.ATTRIBUTE_REQUIREMENTS, attributeRequirements);
  }

  async extract() {
    await this.populateDB();
    console.log("Querying DB for item data...");
    const rows = this.db
      .prepare(`
WITH ITEMS AS (

SELECT DISTINCT
${Tables.BASES}.Name as 'name',
${Tables.CLASSES}.Name as 'class',
${Tables.CLASS_CATEGORIES}.Text as 'category',
${Tables.VISUALS}.DDSFile as 'art',
${Tables.TRADE_CATEGORIES}.Name as 'tradeCategory',
${Tables.TRADE_GROUPS}.Name as 'tradeGroup',
exchange_major.Name as 'exchangeCategory',
exchange_sub.Name as 'exchangeSubCategory',

${Tables.EXCHANGE}.GoldPurchaseFee as 'price',
${Tables.ATTRIBUTE_REQUIREMENTS}.ReqStr as 'strReq',
${Tables.ATTRIBUTE_REQUIREMENTS}.ReqDex as 'dexReq',
${Tables.ATTRIBUTE_REQUIREMENTS}.ReqInt as 'intReq',

${Tables.ARMOUR_TYPES}.Armour as 'armour',
${Tables.ARMOUR_TYPES}.Evasion as 'evasion',
${Tables.ARMOUR_TYPES}.EnergyShield as 'energyShield',
${Tables.ARMOUR_TYPES}.Ward as 'ward',

${Tables.BASES}.SiteVisibility as 'active'

FROM ${Tables.BASES}

LEFT JOIN ${Tables.CLASSES}
ON ${Tables.BASES}.ItemClassesKey = ${Tables.CLASSES}.${PK}

LEFT JOIN ${Tables.CLASS_CATEGORIES}
ON ${Tables.CLASSES}.ItemClassCategory = ${Tables.CLASS_CATEGORIES}.${PK}

LEFT JOIN ${Tables.VISUALS}
ON ${Tables.BASES}.ItemVisualIdentity = ${Tables.VISUALS}.${PK}

LEFT JOIN ${Tables.TRADE_CATEGORIES}
ON ${Tables.BASES}.TradeMarketCategory = ${Tables.TRADE_CATEGORIES}.${PK}
OR ${Tables.CLASSES}.TradeMarketCategory = ${Tables.TRADE_CATEGORIES}.${PK}

LEFT JOIN ${Tables.TRADE_GROUPS}
ON ${Tables.TRADE_CATEGORIES}.Grouping = ${Tables.TRADE_GROUPS}.${PK}

LEFT JOIN ${Tables.EXCHANGE}
ON ${Tables.BASES}.${PK} = ${Tables.EXCHANGE}.Item

LEFT JOIN ${Tables.EXCHANGE_CATEGORY} as exchange_major
ON ${Tables.EXCHANGE}.Category = exchange_major.${PK}

LEFT JOIN ${Tables.EXCHANGE_CATEGORY} as exchange_sub
ON ${Tables.EXCHANGE}.SubCategory = exchange_sub.${PK}

LEFT JOIN ${Tables.ATTRIBUTE_REQUIREMENTS}
ON ${Tables.BASES}.${PK} = ${Tables.ATTRIBUTE_REQUIREMENTS}.BaseItemTypesKey

LEFT JOIN ${Tables.ARMOUR_TYPES}
ON ${Tables.BASES}.${PK} = ${Tables.ARMOUR_TYPES}.BaseItemTypesKey

LEFT JOIN ${Tables.WEAPON_TYPES}
ON ${Tables.BASES}.${PK} = ${Tables.WEAPON_TYPES}.BaseItemTypesKey
)

-- Gear

SELECT
name,
'Weapons' as 'category',
tradeGroup as 'subCategory',
tradeCategory as 'class'
FROM ITEMS
WHERE tradeGroup = 'One Handed Weapons'
`)

      .all();

    fs.writeFileSync(
      "./packages/data/poe2/items.json",
      JSON.stringify(rows, null, " "),
    );

    // exportFiles(
    //   rows.map((item) => item.file),
    //   "packages/assets/poe2/images",
    //   this.loader,
    // );
    extractMinimapIcons(minimapIcons, "./packages/assets/poe2/minimap.json");
  }
}

const PATCH_VER = "4.1.0.11";

async function main() {
  const dat = new DatFiles(PATCH_VER);
  await dat.init();
  await dat.extract();
}

main();
