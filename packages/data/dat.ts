import itemVisual from "./poe2/tables/English/ItemVisualIdentity.json";
import itemClasses from "./poe2/tables/English/ItemClasses.json";
import itemClassCategories from "./poe2/tables/English/ItemClassCategories.json";
import baseTypes from "./poe2/tables/English/BaseItemTypes.json";
import tradeCategory from "./poe2/tables/English/TradeMarketCategory.json";
import tradeCategoryGroup from "./poe2/tables/English/TradeMarketCategoryGroups.json";
import armourTypes from "./poe2/tables/English/ArmourTypes.json";
import skillGems from "./poe2/tables/English/SkillGems.json";
import currencyExchange from "./poe2/tables/English/CurrencyExchange.json";
import currencyExchangeCategories from "./poe2/tables/English/CurrencyExchangeCategories.json";
import minimapIcons from "./poe2/tables/English/MinimapIcons.json";
import Database from "better-sqlite3";
import fs from "node:fs";
import { extractMinimapIcons } from "./minimap";
import { extractImages } from "./image";

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
}

export class DatFiles {
  db: Database;

  constructor() {
    this.db = new Database("chromatic.db", {});
    this.db.pragma("journal_mode = WAL");
  }

  insertDBRecords(table: Tables, data: Record<string, unknown>[]) {
    const insert = this.db.prepare(this.generateInsertStmt(table, data[0]));
    this.db.transaction((entries: typeof data) => {
      for (const entry of entries) {
        insert.run(entry);
      }
    })(data);
  }

  generateInsertStmt(table: string, entry: { [key: string]: unknown }) {
    return `INSERT OR REPLACE INTO ${table}(${Object.keys(entry)}) VALUES(${Object.keys(entry).map((key) => `@${key}`)})`;
  }

  async createDBTable(
    name: string,
    fields: { value: string; type: "TEXT" | "INTEGER" | "BLOB" }[],
  ) {
    const query = `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY, ${fields.map((entry) => `${entry.value} ${entry.type}`)})`;
    return this.db.exec(query);
  }

  async populateDB() {
    console.log("Populating DB with game data...");
    this.createDBTable(Tables.TRADE_GROUPS, [{ value: "name", type: "TEXT" }]);
    this.createDBTable(Tables.TRADE_CATEGORIES, [
      { value: "name", type: "TEXT" },
      { value: "tradeGroupId", type: "INTEGER" },
    ]);
    this.createDBTable(Tables.CLASS_CATEGORIES, [
      { value: "name", type: "TEXT" },
    ]);
    this.createDBTable(Tables.CLASSES, [
      { value: "name", type: "TEXT" },
      { value: "tradeCategoryId", type: "INTEGER" },
      { value: "classCategoryId", type: "INTEGER" },
    ]);
    this.createDBTable(Tables.BASES, [
      { value: "name", type: "TEXT" },
      { value: "active", type: "INTEGER" },
      { value: "classId", type: "INTEGER" },
      { value: "tradeCategoryId", type: "INTEGER" },
      { value: "visualId", type: "INTEGER" },
    ]);
    this.createDBTable(Tables.EXCHANGE, [
      { value: "base", type: "INTEGER" },
      { value: "category", type: "INTEGER" },
      { value: "subCategory", type: "INTEGER" },
      { value: "value", type: "INTEGER" },
    ]);
    this.createDBTable(Tables.EXCHANGE_CATEGORY, [
      { value: "name", type: "TEXT" },
    ]);
    this.createDBTable(Tables.VISUALS, [{ value: "file", type: "TEXT" }]);
    this.createDBTable(Tables.ARMOUR_TYPES, [
      { value: "baseId", type: "INTEGER" },
      { value: "value", type: "INTEGER" },
      { value: "armMin", type: "INTEGER" },
      { value: "armMax", type: "INTEGER" },
      { value: "evaMin", type: "INTEGER" },
      { value: "evaMax", type: "INTEGER" },
      { value: "esMin", type: "INTEGER" },
      { value: "esMax", type: "INTEGER" },
      { value: "wardMin", type: "INTEGER" },
      { value: "wardMax", type: "INTEGER" },
    ]);
    this.createDBTable(Tables.SKILL_GEMS, [
      { value: "baseId", type: "INTEGER" },
      { value: "str", type: "INTEGER" },
      { value: "dex", type: "INTEGER" },
      { value: "int", type: "INTEGER" },
      { value: "vaal", type: "INTEGER" },
    ]);

    this.insertDBRecords(
      Tables.TRADE_GROUPS,
      tradeCategoryGroup.map((entry, id) => ({
        id,
        name: entry.Name,
      })),
    );

    this.insertDBRecords(
      Tables.TRADE_CATEGORIES,
      tradeCategory.map((entry, id) => ({
        id,
        name: entry.Name,
        tradeGroupId: entry.Group,
      })),
    );

    this.insertDBRecords(
      Tables.CLASS_CATEGORIES,
      itemClassCategories.map((entry, id) => ({
        id,
        name: entry.Text,
      })),
    );

    this.insertDBRecords(
      Tables.CLASSES,
      itemClasses.map((entry, id) => ({
        id,
        name: entry.Name,
        tradeCategoryId: entry.TradeMarketCategory,
        classCategoryId: entry.ItemClassCategory,
      })),
    );

    this.insertDBRecords(
      Tables.BASES,
      baseTypes.map((entry, id: number) => ({
        id,
        name: entry.Name,
        active: entry.SiteVisibility,
        classId: entry.ItemClassesKey,
        tradeCategoryId: entry.TradeMarketCategory,
        visualId: entry.ItemVisualIdentity,
      })),
    );

    this.insertDBRecords(
      Tables.EXCHANGE,
      currencyExchange.map((entry, id) => ({
        id,
        base: entry.Item,
        category: entry.Category,
        subCategory: entry.SubCategory,
        value: entry.GoldPurchaseFee,
      })),
    );

    this.insertDBRecords(
      Tables.EXCHANGE_CATEGORY,
      currencyExchangeCategories.map((entry, id) => ({
        id,
        name: entry.Name,
      })),
    );

    this.insertDBRecords(
      Tables.VISUALS,
      itemVisual.map((entry, id) => ({
        id,
        file: entry.DDSFile,
      })),
    );

    this.insertDBRecords(
      Tables.ARMOUR_TYPES,
      armourTypes.map((entry, id) => ({
        id,
        baseId: entry.BaseItemTypesKey,
        value:
          (entry.ArmourMin +
            entry.ArmourMax +
            (entry.EvasionMin + entry.EvasionMax) +
            (entry.EnergyShieldMin + entry.EnergyShieldMax) +
            (entry.WardMin + entry.WardMax)) /
          4,
        armMin: entry.ArmourMin,
        armMax: entry.ArmourMax,
        evaMin: entry.EvasionMin,
        evaMax: entry.EvasionMax,
        esMin: entry.EnergyShieldMin,
        esMax: entry.EnergyShieldMax,
        wardMin: entry.WardMin,
        wardMax: entry.WardMax,
      })),
    );

    this.insertDBRecords(
      Tables.SKILL_GEMS,
      skillGems.map((entry, id) => ({
        id,
        baseId: entry.BaseItemTypesKey,
        str: entry.StrengthRequirementPercent,
        dex: entry.DexterityRequirementPercent,
        int: entry.IntelligenceRequirementPercent,
        vaal: entry.IsVaalVariant ? 1 : 0,
      })),
    );
  }

  async extract() {
    console.log("Querying DB for raw item data...");
    const rows = this.db
      .prepare(
        `
        WITH ENTRIES AS (
        SELECT
        e.name as base,
        b.name as class,
        c.name as type,
        a.name trade_group,
        b.name as trade_category,
        h.name as exchange_category,
        i.name as exchange_sub_category,
e.active as active,
        f.file as file,
        k.str as str,
        k.dex as dex,
        k.int as int,
        k.vaal as isVaalGem,
        j.armMin as armMin,
        j.armMax as armMax,
        j.evaMin as evaMin,
        j.evaMax as evaMax,
        j.esMin as esMin,
        j.esMax as esMax,
        j.wardMin as wardMin,
        j.wardMax as wardMax,
        (CASE
          WHEN g.value is not null
          THEN g.value
          WHEN j.value is not null
          THEN j.value
          ELSE null
        END) as value
        FROM ${Tables.TRADE_GROUPS} a
        FULL OUTER JOIN ${Tables.TRADE_CATEGORIES} b
        on a.id = b.tradeGroupId
        FULL OUTER JOIN ${Tables.CLASSES} c
        on b.id = c.tradeCategoryId
        FULL OUTER JOIN ${Tables.CLASS_CATEGORIES} d
        on d.id = c.classCategoryId
        FULL OUTER JOIN ${Tables.BASES} e
        on c.id = e.classId
        LEFT JOIN ${Tables.EXCHANGE} g
        on e.id = g.base
        LEFT JOIN ${Tables.EXCHANGE_CATEGORY} h
        on g.category = h.id
        LEFT JOIN ${Tables.EXCHANGE_CATEGORY} i
        on g.subCategory = i.id
        LEFT JOIN ${Tables.VISUALS} f
        on e.visualId = f.id
        LEFT JOIN ${Tables.ARMOUR_TYPES} j
        on e.id = j.baseId
        LEFT JOIN ${Tables.SKILL_GEMS} k
        on e.id = k.baseId
        WHERE (c.name != '' and e.active != 0 and e.active != 2 and c.name != 'Hidden Items')
        )

        SELECT *
        FROM ENTRIES
        `,
      )
      .all();

    fs.writeFileSync(
      "./packages/data/raw-items.json",
      JSON.stringify(rows, null, " "),
    );

    extractMinimapIcons(minimapIcons, "./packages/assets/poe2/minimap.json");
    extractImages(rows, "./packages/assets/poe2/images");
  }
}

async function main() {
  const dat = new DatFiles();
  await dat.populateDB();
  await dat.extract();
}

main();
