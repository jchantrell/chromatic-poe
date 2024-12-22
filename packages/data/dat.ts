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

export type Item = {
  name: string;
  category: string;
  subCategory: string;
  class: string;
  type: string;
  art: string;
  active: 0 | 1 | 2;
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
    console.log("Populating DB with dat files...");
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
    console.log("Querying DB for items...");
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
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS}.ReqStr,
  ${Tables.SKILL_GEMS}.StrengthRequirementPercent
) as 'strReq',
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS}.ReqDex,
  ${Tables.SKILL_GEMS}.DexterityRequirementPercent
) as 'dexReq',
COALESCE(
  ${Tables.ATTRIBUTE_REQUIREMENTS}.ReqInt,
  ${Tables.SKILL_GEMS}.IntelligenceRequirementPercent
) as 'intReq',

${Tables.ARMOUR_TYPES}.Armour as 'armour',
${Tables.ARMOUR_TYPES}.Evasion as 'evasion',
${Tables.ARMOUR_TYPES}.EnergyShield as 'energyShield',
${Tables.ARMOUR_TYPES}.Ward as 'ward',

${Tables.WEAPON_TYPES}.DamageMin as 'dmgMin',
${Tables.WEAPON_TYPES}.DamageMax as 'dmgMax',
${Tables.WEAPON_TYPES}.Speed as 'speed',

${Tables.BASES}.Height as 'height',
${Tables.BASES}.Width as 'width',
${Tables.BASES}.SiteVisibility as 'active',

${Tables.SKILL_GEMS}.GemType as 'gemType'

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

LEFT JOIN ${Tables.SKILL_GEMS}
ON ${Tables.BASES}.${PK} = ${Tables.SKILL_GEMS}.BaseItemTypesKey
)

-- Weapons
SELECT DISTINCT
name,
'Weapons' AS category,
tradeCategory AS class,
(CASE
  WHEN strReq != 0 AND dexReq != 0 AND intReq != 0
  THEN 'Hybrid'
  WHEN strReq != 0 AND dexReq != 0
  THEN 'Str/Dex'
  WHEN strReq != 0 AND intReq != 0
  THEN 'Str/Int'
  WHEN intReq != 0 AND dexReq != 0
  THEN 'Dex/Int'
  WHEN tradeCategory in ('One Hand Swords', 'Two Hand Swords', 'One Hand Axes', 'Two Hand Axes', 'Crossbows')
  THEN 'Str/Dex'
  WHEN tradeCategory in ('Daggers')
  THEN 'Dex/Int'
  WHEN tradeCategory in ('One Hand Maces', 'Two Hand Maces')
  THEN 'Str'
  WHEN tradeCategory in ('Bows', 'Claws', 'Spears', 'Warstaves')
  THEN 'Dex'
  WHEN tradeCategory in ('Staves', 'Wands', 'Sceptres')
  THEN 'Int'
  ELSE 'Unknown'
END) AS type,
art,
height,
width,
price,
(dmgMin + dmgMax) / 2 * (1000 / speed) AS score,
strReq,
dexReq,
intReq
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
  THEN 'Str/Dex'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Str/Int'
  WHEN armour != 0
  THEN 'Str'
  WHEN evasion != 0
  THEN 'Dex'
  WHEN energyShield != 0
  THEN 'Int'
  WHEN tradeCategory in ('Quivers')
  THEN 'Dex'
  ELSE 'Unknown'
END) AS type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
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
  THEN 'Hybrid'
  WHEN ward != 0
  THEN 'Ward'
  WHEN armour != 0 AND evasion != 0
  THEN 'Str/Dex'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Str/Int'
  WHEN armour != 0
  THEN 'Str'
  WHEN evasion != 0
  THEN 'Dex'
  WHEN energyShield != 0
  THEN 'Int'
  ELSE 'Unknown'
END) AS type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE tradeGroup IN ('Armour')

UNION ALL

-- Jewellery
SELECT DISTINCT
name,
'Jewellery' AS category,
class,
null AS type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE tradeGroup IN ('Jewellery')

UNION ALL

-- Flasks
SELECT DISTINCT
name,
'Flasks' AS category,
class,
null AS type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE tradeGroup IN ('Flasks')

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
  THEN 'Str/Dex'
  WHEN strReq != 0 AND intReq != 0
  THEN 'Str/Int'
  WHEN intReq != 0 AND dexReq != 0
  THEN 'Dex/Int'
  WHEN strReq != 0
  THEN 'Str'
  WHEN dexReq != 0
  THEN 'Dex'
  WHEN intReq != 0
  THEN 'Int'
  ELSE 'Unknown'
END) as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE tradeGroup IN ('Gems') AND name NOT LIKE '[DNT]%' AND name != 'Coming Soon'

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
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Jewels'

UNION ALL

-- Maps
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Waystones'

UNION ALL

-- Tablets
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Tablet'

UNION ALL

-- Expedition
SELECT DISTINCT
name,
'Expedition' AS category,
'Logbook' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Expedition Logbooks'

UNION ALL

SELECT DISTINCT
name,
'Expedition' AS category,
'Currency' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE name IN ('Exotic Coinage', 'Sun Artifact', 'Broken Circle Artifact', 'Black Scythe Artifact', 'Order Artifact')


UNION ALL

-- Ultimatum
SELECT DISTINCT
name,
'Ultimatum' AS category,
'Fragments' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE exchangeSubcategory = 'Ultimatum Fragments'
OR class = 'Inscribed Ultimatum'

UNION ALL

SELECT DISTINCT
name,
'Ultimatum' AS category,
'Soul Cores' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE exchangeCategory = 'Soul Cores'

UNION ALL

-- Sekhema
SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
'Fragments' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Trial Coins'

UNION ALL

SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Relics'

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
'Fragments' as class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE name = 'An Audience with the King'

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE class = 'Omens'

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
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE exchangeCategory IN ('Delirium', 'Breach')

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
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE exchangeCategory IN ('Essences', 'Currency', 'Runes')

UNION ALL

-- Boss Fragments
SELECT DISTINCT
name,
'Pinnacle' AS category,
'Fragments' AS class,
null as type,
art,
height,
width,
price,
0 AS score, -- FIXME
strReq,
dexReq,
intReq
FROM ITEMS
WHERE exchangeSubcategory IN ('Pinnacle Fragments')
`)

      .all() as Item[];
    // exportFiles(
    //   [...rows.map((item) => item.art), "Art/2DArt/Minimap/Player.png"],
    //   "packages/assets/poe2/images",
    //   this.loader,
    // );
    for (const item of rows) {
      item.art = `poe2/images/${item.art.replaceAll("/", "@").replace("dds", "png")}`;
    }
    console.log("Writing item file...");
    fs.writeFileSync(
      "./packages/data/poe2/items.json",
      JSON.stringify(rows, null, " "),
    );
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
