import itemVisual from "./tables/English/ItemVisualIdentity.json";
import itemClasses from "./tables/English/ItemClasses.json";
import itemClassCategories from "./tables/English/ItemClassCategories.json";
import baseTypes from "./tables/English/BaseItemTypes.json";
import tradeCategory from "./tables/English/TradeMarketCategory.json";
import tradeCategoryGroup from "./tables/English/TradeMarketCategoryGroups.json";
import armourTypes from "./tables/English/ArmourTypes.json";
import skillGems from "./tables/English/SkillGems.json";
import currencyExchange from "./tables/English/CurrencyExchange.json";
import currencyExchangeCategories from "./tables/English/CurrencyExchangeCategories.json";
import Database from "better-sqlite3";
import fs from "node:fs";

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

export class DbRepo {
  db: Database;

  constructor() {
    this.db = new Database("chromatic.db", {});
    this.db.pragma("journal_mode = WAL");
  }

  insert(table: Tables, data: Record<string, unknown>[]) {
    const insert = this.db.prepare(this.insertStmt(table, data[0]));
    this.db.transaction((entries: typeof data) => {
      for (const entry of entries) {
        insert.run(entry);
      }
    })(data);
  }

  async populate() {
    console.log("Populating DB with game data...");
    this.createTable(Tables.TRADE_GROUPS, [{ value: "name", type: "TEXT" }]);
    this.createTable(Tables.TRADE_CATEGORIES, [
      { value: "name", type: "TEXT" },
      { value: "tradeGroupId", type: "INTEGER" },
    ]);
    this.createTable(Tables.CLASS_CATEGORIES, [
      { value: "name", type: "TEXT" },
    ]);
    this.createTable(Tables.CLASSES, [
      { value: "name", type: "TEXT" },
      { value: "tradeCategoryId", type: "INTEGER" },
      { value: "classCategoryId", type: "INTEGER" },
    ]);
    this.createTable(Tables.BASES, [
      { value: "name", type: "TEXT" },
      { value: "active", type: "INTEGER" },
      { value: "classId", type: "INTEGER" },
      { value: "tradeCategoryId", type: "INTEGER" },
      { value: "visualId", type: "INTEGER" },
    ]);
    this.createTable(Tables.EXCHANGE, [
      { value: "base", type: "INTEGER" },
      { value: "category", type: "INTEGER" },
      { value: "subCategory", type: "INTEGER" },
      { value: "value", type: "INTEGER" },
    ]);
    this.createTable(Tables.EXCHANGE_CATEGORY, [
      { value: "name", type: "TEXT" },
    ]);
    this.createTable(Tables.VISUALS, [{ value: "file", type: "TEXT" }]);
    this.createTable(Tables.ARMOUR_TYPES, [
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
    this.createTable(Tables.SKILL_GEMS, [
      { value: "baseId", type: "INTEGER" },
      { value: "str", type: "INTEGER" },
      { value: "dex", type: "INTEGER" },
      { value: "int", type: "INTEGER" },
      { value: "vaal", type: "INTEGER" },
    ]);

    this.insert(
      Tables.TRADE_GROUPS,
      tradeCategoryGroup.map((entry, id) => ({
        id,
        name: entry.Name,
      })),
    );

    this.insert(
      Tables.TRADE_CATEGORIES,
      tradeCategory.map((entry, id) => ({
        id,
        name: entry.Name,
        tradeGroupId: entry.Group,
      })),
    );

    this.insert(
      Tables.CLASS_CATEGORIES,
      itemClassCategories.map((entry, id) => ({
        id,
        name: entry.Text,
      })),
    );

    this.insert(
      Tables.CLASSES,
      itemClasses.map((entry, id) => ({
        id,
        name: entry.Name,
        tradeCategoryId: entry.TradeMarketCategory,
        classCategoryId: entry.ItemClassCategory,
      })),
    );

    this.insert(
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

    this.insert(
      Tables.EXCHANGE,
      currencyExchange.map((entry, id) => ({
        id,
        base: entry.Item,
        category: entry.Category,
        subCategory: entry.SubCategory,
        value: entry.GoldPurchaseFee,
      })),
    );

    this.insert(
      Tables.EXCHANGE_CATEGORY,
      currencyExchangeCategories.map((entry, id) => ({
        id,
        name: entry.Name,
      })),
    );

    this.insert(
      Tables.VISUALS,
      itemVisual.map((entry, id) => ({
        id,
        file: entry.DDSFile,
      })),
    );

    this.insert(
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

    this.insert(
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

  async query() {
    console.log("Querying DB for baseline filter data...");
    const extraFields = `
        str,
        dex,
        int,
        isVaalGem,
        armMin,
        armMax,
        evaMin,
        evaMax,
        esMin,
        esMax,
        wardMin,
        wardMax,
      `;
    const rows = this.db
      .prepare(
        `
        WITH ENTRIES AS (
        SELECT
        coalesce(a.name, 'Other') as major_category,
        coalesce(b.name, d.name) as sub_category,
        h.name as exchange_category,
        i.name as exchange_sub_category,
        c.name as type,
        e.name as base,
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
        on c.id = e.classId OR b.id = e.tradeCategoryId
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
        WHERE c.name != '' and e.active != 0 and c.name != 'Hidden Items'
        )

        SELECT DISTINCT
        base, 
        file,
       ${extraFields}
        value,
        (CASE
          WHEN sub_category = 'Trinkets'
          THEN 'Static'
          ELSE 'Gear'
        END) as pool,
        (CASE
          WHEN sub_category = 'Quivers'
          THEN 'Quivers'
          WHEN sub_category = 'Tinctures'
          THEN 'Flasks'
          WHEN sub_category = 'Trinkets'
          THEN 'Heist Items'
          ELSE major_category
        END) as major_category,
        (CASE
          WHEN base like 'Awakened%'
          THEN 'Awakened'
          WHEN base like 'Vaal%' AND major_category = 'Gems'
          THEN 'Vaal'
          WHEN sub_category = 'Active Skill Gems'
          THEN 'Active'
          WHEN sub_category = 'Support Skill Gems'
          THEN 'Support'
          WHEN base like '%Talisman'
          THEN 'Talismans'
          ELSE sub_category
        END) as sub_category
        FROM ENTRIES
        WHERE major_category != 'Other'
        AND base != 'Quickstep'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
       (CASE
          WHEN sub_category = 'Memories'
          THEN 'Fragments'
          WHEN sub_category = 'Corpse'
          THEN 'Corpses'
          ELSE sub_category
        END) as major_category,
       (CASE
          WHEN sub_category = 'Memories'
          THEN 'Memories'
          WHEN base like '%Hydra'
          THEN 'Hydra'
          WHEN base like '%Frozen Cannibal'
          THEN 'Frozen Cannibal'
          WHEN base like '%Fiery Cannibal'
          THEN 'Fiery Cannibal'
          WHEN base like '%Dark Marionette'
          THEN 'Dark Marionette'
          WHEN base like '%Naval Officer'
          THEN 'Naval Officer'
          WHEN base like '%Dancing Sword'
          THEN 'Dancing Sword'
          WHEN base like '%Needle Horror'
          THEN 'Needle Horror'
          WHEN base like '%Serpent Warrior'
          THEN 'Serpent Warrior'
          WHEN base like '%Pain Artist'
          THEN 'Pain Artist'
          WHEN base like '%Sawblade Horror'
          THEN 'Sawblade Horror'
          WHEN base like '%Blood Demon'
          THEN 'Blood Demon'
          WHEN base like '%Slashing Horror'
          THEN 'Slashing Horror'
          WHEN base like '%Druidic Alchemist'
          THEN 'Druidic Alchemist'
          WHEN base like '%Blasphemer'
          THEN 'Blasphemer'
          WHEN base like '%Judgemental Spirit'
          THEN 'Judgemental Spirit'
          WHEN base like '%Primal Thunderbird'
          THEN 'Primal Thunderbird'
          WHEN base like '%Spirit of Fortune'
          THEN 'Spirit of Fortune'
          WHEN base like '%Primal Demiurge'
          THEN 'Primal Demiurge'
          WHEN base like '%Runic Skeleton'
          THEN 'Runic Skeleton'
          WHEN base like '%Warlord'
          THEN 'Warlord'
          WHEN base like '%Dark Reaper'
          THEN 'Dark Reaper'
          WHEN base like '%Hulking Miscreation'
          THEN 'Hulking Miscreation'
          WHEN base like '%Sanguimancer Demon'
          THEN 'Sanguimancer Demon'
          WHEN base like '%Shadow Berserker'
          THEN 'Shadow Berserker'
          WHEN base like '%Spider Matriarch'
          THEN 'Spider Matriarch'
          WHEN base like '%Half-remembered Goliath'
          THEN 'Half-remembered Goliath'
          WHEN base like '%Meatsack'
          THEN 'Meatsack'
          WHEN base like '%Eldritch Eye'
          THEN 'Eldritch Eye'
          WHEN base like '%Guardian Turtle'
          THEN 'Guardian Turtle'
          WHEN base like '%Shadow Construct'
          THEN 'Shadow Construct'
          WHEN base like '%Forest Tiger'
          THEN 'Forest Tiger'
          WHEN base like '%Forest Warrior' 
          THEN 'Forest Warrior' 
          ELSE type 
        END) as sub_category
        FROM ENTRIES
        WHERE major_category = 'Other' 
        AND exchange_category is null
        AND sub_category NOT IN ('Jewels', 'Abyss Jewels', 'Maps', 'Map Fragments', 'Misc Map Items', 'Currency', 'Divination Cards', 'Incubators', 'Expedition Items', 'Recombinators', 'Pieces', 'Relics')

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Sanctum' as major_category,
        (CASE
          WHEN sub_category = 'Misc Map Items'
          THEN 'Tomes'
          ELSE sub_category
        END) as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Relics')
        OR base = 'Forbidden Tome'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Miscellaneous' as major_category,
        sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Pieces')

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Gear' as pool,
        'Jewels' as major_category,
        'Abyss' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Abyss Jewels')

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Gear' as pool,
        'Jewels' as major_category,
        'Clusters' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Jewels')
        AND base LIKE '%Cluster Jewel'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Gear' as pool,
        'Jewels' as major_category,
        'Common' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Jewels')
        AND base NOT LIKE '%Cluster Jewel'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Maps' as major_category,
        sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Maps')

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        (CASE
          WHEN sub_category = 'Misc Map Items'
          THEN 'Fragments'
          ELSE sub_category
        END) as major_category,
        'Misc' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Misc Map Items')
        AND base not like '%Invitation'
        AND base not like '%Reliquary Key'
        AND base not like '%Sanctum'
        AND base != 'Forbidden Tome'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        (CASE
          WHEN sub_category = 'Misc Map Items'
          THEN 'Fragments'
          ELSE sub_category
        END) as major_category,
        'Keys' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Misc Map Items')
        AND base like '%Reliquary Key'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        (CASE
          WHEN sub_category = 'Misc Map Items'
          THEN 'Fragments'
          ELSE sub_category
        END) as major_category,
        'Eldritch' as sub_category
        FROM ENTRIES
        WHERE sub_category IN ('Misc Map Items')
        AND base like '%Invitation'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        (CASE
          WHEN exchange_sub_category = 'Delirium Orbs'
          THEN 'Delirium'
          WHEN exchange_sub_category = 'Runecrafting'
          THEN 'Currency'
          WHEN exchange_sub_category = 'Scouting Reports'
          THEN 'Currency'
          WHEN exchange_sub_category = 'Oils'
          THEN 'Blight'
          WHEN base like '%Tattoo%'
          THEN 'Tattoos'
          WHEN base like '%Lifeforce%'
          THEN 'Currency'
          WHEN exchange_category = 'Catalysts'
          THEN 'Currency'
          WHEN base like 'Omen of%'
          THEN 'Miscellaneous'
          WHEN base like 'Vial%'
          THEN 'Miscellaneous'
          WHEN base like '%Scroll' and base != 'Portal Scroll'
          THEN 'Miscellaneous'
          WHEN base like '%Recombinator'
          THEN 'Miscellaneous'
          WHEN exchange_category is null
          THEN 'Currency'
          ELSE exchange_category
        END) as major_category,
        (CASE
          WHEN exchange_sub_category = 'Delirium'
          THEN 'Fragments'
          WHEN exchange_sub_category = 'Delirium Orbs'
          THEN 'Orbs'
          WHEN base like '%Tattoo%' AND exchange_sub_category is null
          THEN 'Miscellaneous'
          WHEN base like 'Omen%'
          THEN 'Omens'
          WHEN base like 'Vial%'
          THEN 'Vials'
          WHEN base like '%Scroll' and base != 'Portal Scroll'
          THEN 'Scrolls'
          WHEN base like '%Recombinator'
          THEN 'Recombinators'
          WHEN exchange_sub_category like '%Breachstones'
          THEN SUBSTR(exchange_sub_category, 1, INSTR(exchange_sub_category, ' ') - 1)
          WHEN exchange_sub_category like '%Legion Fragments'
          THEN SUBSTR(exchange_sub_category, 1, INSTR(exchange_sub_category, ' ') - 1)
          WHEN exchange_sub_category like 'Divination Cards Rewarding%'
          THEN SUBSTR(exchange_sub_category, 27)
          WHEN exchange_sub_category = 'Other Divination Cards'
          THEN 'Other'
          WHEN exchange_sub_category = 'Currency'
          THEN 'Common'
          WHEN exchange_sub_category is not null
          THEN exchange_sub_category
          ELSE 'Misc'
        END) as sub_category
        FROM ENTRIES
        WHERE (major_category = 'Other')
        AND (exchange_category is not null OR sub_category = 'Currency')
        AND exchange_sub_category IS NOT 'Expedition'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Legion' as major_category,
        'Incubators' as sub_category
        FROM ENTRIES
        WHERE base like '%Incubator'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Divination Cards' as major_category,
        'Other' as sub_category
        FROM ENTRIES
        WHERE major_category = 'Other'
        AND exchange_category is null AND sub_category = 'Divination Cards'

        UNION ALL

        SELECT DISTINCT
        base,
        file,
       ${extraFields}
        value,
        'Static' as pool,
        'Expedition' as major_category,
        (CASE
          WHEN base = 'Expedition Logbook'
          THEN 'Logbooks'
          ELSE 'Currency'
        END) as sub_category
        FROM ENTRIES
        WHERE major_category = 'Other'
        AND sub_category = 'Expedition Items'
        `,
      )
      .all();
    fs.writeFileSync(
      "./packages/data/raw.json",
      JSON.stringify(rows, null, " "),
    );
  }

  insertStmt(table: string, entry: { [key: string]: unknown }) {
    return `INSERT OR REPLACE INTO ${table}(${Object.keys(entry)}) VALUES(${Object.keys(entry).map((key) => `@${key}`)})`;
  }

  async createTable(
    name: string,
    fields: { value: string; type: "TEXT" | "INTEGER" | "BLOB" }[],
  ) {
    const query = `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY, ${fields.map((entry) => `${entry.value} ${entry.type}`)})`;
    return this.db.exec(query);
  }
}

async function main() {
  const db = new DbRepo();
  await db.populate();
  await db.query();
}

main();
