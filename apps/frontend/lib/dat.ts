import { readColumn, readDatFile } from "pathofexile-dat/dat.js";
import { SCHEMA_URL, type SchemaFile, ValidFor } from "pathofexile-dat-schema";
import { ArtManager } from "./art";
import { BundleManager } from "./bundle";
import { Database } from "./db";
import type { Item } from "./filter";
import { IDBManager } from "./idb";
import { MinimapManager } from "./minimap";
import { getQuery, TABLES } from "./queries";
import { to } from "./utils";
import { WikiManager } from "./wiki";

interface Header {
  name: string | null;
  offset: number;
  type: {
    array: boolean;
    interval: boolean;
    integer?: { unsigned: boolean; size: number };
    decimal?: { size: number };
    string?: object;
    boolean?: object;
    key?: { foreign: boolean };
  };
}

export class DatManager {
  private idb: IDBManager = new IDBManager();
  private loader: BundleManager = new BundleManager(this.idb);
  private art: ArtManager = new ArtManager(this.loader, this.idb);
  private db: Database = new Database();
  private wiki: WikiManager = new WikiManager(this.idb);
  private schema: SchemaFile | null = null;
  minimap: MinimapManager = new MinimapManager(this.art, this.idb);
  patch!: string;

  async load(patch: string) {
    this.patch = patch;
    if (!this.db.db) {
      await this.db.init();
      await this.db.exec(
        "CREATE TABLE IF NOT EXISTS _patches (version TEXT PRIMARY KEY, date INTEGER)",
      );
    }

    const items = await this.getItems(patch);
    const mods = await this.getMods(patch);
    const minimap = await this.minimap.getIcons(patch);
    return { items, mods, minimap };
  }

  async getItems(patch: string) {
    const items = (await this.db.query(
      getQuery(patch, "items"),
    )) as unknown as Item[];

    const uniques = (await this.db.query(
      getQuery(patch, "uniques"),
    )) as unknown as Item[];

    const gameVersion = patch.startsWith("3") ? 1 : 2;

    const wikiUniques = await this.wiki.getUniques(gameVersion);
    for (const unique of uniques) {
      if (unique.base) continue;
      const entry = wikiUniques.find((entry) => entry.name === unique.name);
      if (entry) {
        unique.base = entry.base;
      } else {
        console.warn(`Missed base for ${unique.name}`);
      }
    }

    const allItems = [...items, ...uniques];
    const artItems = allItems.map((i) => ({ name: i.name, path: i.art }));
    this.art
      .ensureCached(patch, artItems)
      .catch((e) => console.error("Failed to ensure art cache", e));

    return allItems;
  }

  async getArt(name: string) {
    return await this.art.getCached(this.patch, name);
  }

  async getMods(patch: string) {
    const query = getQuery(patch, "mods");
    return await this.db.query(query);
  }

  async extract(
    patch: string,
    onProgress?: (percent: number, msg: string) => void,
  ) {
    this.patch = patch;
    if (!this.db.db) {
      await this.db.init();
      await this.db.exec(
        "CREATE TABLE IF NOT EXISTS _patches (version TEXT PRIMARY KEY, date INTEGER)",
      );
    }
    const check = await this.db.query(
      "SELECT version FROM _patches WHERE version = ?",
      [patch],
    );

    if (check.length > 0) {
      console.log(`Patch ${patch} found in DB`);
      if (onProgress) onProgress(100, "Done");
      return;
    }

    console.log(
      `Patch ${patch} not found in DB or mismatch. Fetching from game servers...`,
    );
    if (onProgress) onProgress(0, "Fetching bundle index...");
    await this.loader.init(patch);

    console.log(`Starting extraction for patch ${patch}...`);
    for (let i = 0; i < TABLES.length; i++) {
      const tableName = TABLES[i];
      if (onProgress) {
        onProgress((i / TABLES.length) * 100, `Processing ${tableName}...`);
      }
      console.log(`Processing ${tableName}...`);
      const [err] = await to(this.importTable(tableName));
      if (err) {
        console.warn(`Failed to process ${tableName}`, err);
      }
    }

    const gameVersion = patch.startsWith("3") ? 1 : 2;

    const minimap = await this.db.query(getQuery(patch, "minimap"));
    await this.minimap.extract(patch, minimap);

    console.log("Querying wiki for unique bases...");
    await this.wiki.queryWiki(gameVersion, 0, []);

    await this.db.run(
      "INSERT OR REPLACE INTO _patches (version, date) VALUES (?, ?)",
      [this.patch, Date.now()],
    );

    if (onProgress) onProgress(100, "Finalizing...");

    console.log("Extraction complete.");
  }

  async importSchema() {
    console.log("Fetching schema...");
    const proxyUrl =
      import.meta.env.VITE_CORS_PROXY_URL || "https://corsproxy.io/?";
    const url = `${proxyUrl}${encodeURIComponent(SCHEMA_URL)}`;
    const response = await fetch(url);
    this.schema = await response.json();
  }

  async importTable(tableName: string) {
    if (!this.schema) await this.importSchema();
    if (!this.schema) throw new Error("Failed to load schema");

    const isPoE2 = this.patch.startsWith("4.");
    const validFor = isPoE2 ? ValidFor.PoE2 : ValidFor.PoE1;
    const tableSchema = this.schema.tables.find(
      (s) => s.name === tableName && s.validFor & validFor,
    );

    if (!tableSchema) {
      const anySchema = this.schema.tables.find((s) => s.name === tableName);
      if (anySchema) {
        console.log(
          `Skipping ${tableName} (not valid for PoE ${isPoE2 ? "2" : "1"})`,
        );
        return;
      }
      throw new Error(`Schema not found for table: ${tableName}`);
    }

    console.log(`Importing table: ${tableName}...`);

    const extensions = [".datc64", ".dat64", ".dat"];
    let content: Uint8Array | null = null;
    let usedExt = "";

    for (const ext of extensions) {
      if (content) break;

      const paths = [`Data/${tableName}${ext}`];

      if (isPoE2) {
        paths.unshift(`data/balance/${tableName}${ext}`);
      }

      for (const path of paths) {
        try {
          content = await this.loader.getFileContents(path);
          if (content) {
            usedExt = ext;
            console.log(`Found ${path}`);
            break;
          }
        } catch (_e) {}
      }
    }

    if (!content) throw new Error(`File not found for ${tableName}`);
    if (!usedExt) throw new Error("File extension unknown");

    const datFile = readDatFile(usedExt, content);

    const headers = this.createHeaders(tableSchema);

    const validHeaders = [];
    for (const h of headers) {
      const len = this.getHeaderLength(h);
      if (h.offset + len > datFile.rowLength) {
        console.warn(
          `Stopping import of ${tableName} at column ${h.name} (offset ${h.offset} + ${len} > ${datFile.rowLength})`,
        );
        break;
      }
      validHeaders.push(h);
    }

    const colsData: { name: string; data: any[] }[] = [];

    for (const h of validHeaders) {
      if (!h.name) continue;
      try {
        const data = readColumn(h, datFile);
        colsData.push({ name: h.name, data });
      } catch (e) {
        console.warn(`Skipping column ${h.name} due to read error:`, e);
      }
    }

    const validColumnNames = new Set(colsData.map((c) => c.name));
    const columnsToImport = tableSchema.columns.filter(
      (c) => c.name && validColumnNames.has(c.name),
    );

    const colDefs = columnsToImport.map((c) => {
      let type = "TEXT";
      if (c.array) {
        type = "TEXT"; // JSON
      } else if (
        c.type === "bool" ||
        c.type.startsWith("u") ||
        c.type.startsWith("i")
      ) {
        type = "INTEGER";
      } else if (c.type.startsWith("f")) {
        type = "REAL";
      }
      return `"${c.name}" ${type}`;
    });

    await this.db.exec(`DROP TABLE IF EXISTS "${this.patch}_${tableName}"`);
    await this.db.exec(
      `CREATE TABLE "${this.patch}_${tableName}" ("_index" INTEGER PRIMARY KEY, ${colDefs.join(", ")})`,
    );

    const rowCount = datFile.rowCount;

    const insertSql = `INSERT INTO "${this.patch}_${tableName}" ("_index", ${colsData.map((c) => `"${c.name}"`).join(", ")}) VALUES (?, ${colsData.map(() => "?").join(", ")})`;

    await this.db.transaction(async () => {
      const CHUNK_SIZE = 1000;
      let currentChunk: SQLiteCompatibleType[][] = [];

      for (let i = 0; i < rowCount; i++) {
        const row: SQLiteCompatibleType = [i];
        for (const col of colsData) {
          let val = col.data[i];

          if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
            val = JSON.stringify(val);
          }

          if (typeof val === "boolean") val = val ? 1 : 0;
          row.push(val);
        }

        currentChunk.push(row);

        if (currentChunk.length >= CHUNK_SIZE) {
          await this.db.batchRun(insertSql, currentChunk);
          currentChunk = [];
        }
      }

      if (currentChunk.length > 0) {
        await this.db.batchRun(insertSql, currentChunk);
      }
    });

    console.log(`Imported ${rowCount} rows for ${tableName}`);
  }

  private createHeaders(tableSchema: {
    columns: {
      name: string | null;
      array: boolean;
      interval: boolean;
      type: string;
    }[];
  }) {
    const headers: Header[] = [];
    let offset = 0;

    for (const column of tableSchema.columns) {
      const integer =
        column.type === "u8"
          ? { unsigned: true, size: 1 }
          : column.type === "u16"
            ? { unsigned: true, size: 2 }
            : column.type === "u32"
              ? { unsigned: true, size: 4 }
              : column.type === "u64"
                ? { unsigned: true, size: 8 }
                : column.type === "i8"
                  ? { unsigned: false, size: 1 }
                  : column.type === "i16"
                    ? { unsigned: false, size: 2 }
                    : column.type === "i32"
                      ? { unsigned: false, size: 4 }
                      : column.type === "i64"
                        ? { unsigned: false, size: 8 }
                        : column.type === "enumrow"
                          ? { unsigned: false, size: 4 }
                          : undefined;

      const decimal =
        column.type === "f32"
          ? { size: 4 }
          : column.type === "f64"
            ? { size: 8 }
            : undefined;

      headers.push({
        name: column.name || "",
        offset,
        type: {
          array: column.array,
          interval: column.interval,
          integer,
          decimal,
          string: column.type === "string" ? {} : undefined,
          boolean: column.type === "bool" ? {} : undefined,
          key:
            column.type === "row" || column.type === "foreignrow"
              ? { foreign: column.type === "foreignrow" }
              : undefined,
        },
      });

      const last = headers[headers.length - 1];
      const len = this.getHeaderLength(last);
      if (len === 0 && !column.type.startsWith("ref|")) {
        console.warn(
          `Warning: Zero length calculated for column ${column.name} type ${column.type}`,
        );
      }
      offset += len;
    }
    return headers;
  }

  private getHeaderLength(header: Header) {
    if (header.type.array) return 16;
    if (header.type.string) return 8;

    if (header.type.key) {
      return header.type.key.foreign ? 16 : 8;
    }

    const count = header.type.interval ? 2 : 1;

    if (header.type.integer) return header.type.integer.size * count;
    if (header.type.decimal) return header.type.decimal.size * count;
    if (header.type.boolean) return 1;

    return 0;
  }

  async fetchPoeVersions(): Promise<{
    poe1: string;
    poe2: string;
  }> {
    const response = await fetch("https://poe-versions.obsoleet.org/");
    const data = await response.json();
    return {
      poe1: data.poe,
      poe2: data.poe2,
    };
  }
}

export const dat = new DatManager();
