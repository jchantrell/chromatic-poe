import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { SCHEMA_URL, type SchemaFile, ValidFor } from "pathofexile-dat-schema";
import type { NodeBundleManager } from "./bundle.js";
import type { NodeDatabase } from "./db.js";

// Bypass the package exports map to avoid the WASM eager-load in dat.js barrel.
// Node enforces exports even with createRequire, so resolve the absolute path.
const _require = createRequire(import.meta.url);
const pkgDir = dirname(_require.resolve("pathofexile-dat/bundles.js"));
const { readDatFile } = _require(resolve(pkgDir, "dat/dat-file.js"));
const { readColumn } = _require(resolve(pkgDir, "dat/reader.js"));

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

const CHUNK_SIZE = 1000;

export class NodeDatManager {
  private schema: SchemaFile | null = null;

  constructor(
    private db: NodeDatabase,
    private loader: NodeBundleManager,
  ) {}

  async importSchema(): Promise<void> {
    console.log("Fetching schema...");
    const response = await fetch(SCHEMA_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch schema: ${response.status} ${response.statusText}`,
      );
    }
    this.schema = await response.json();
  }

  async importAllTables(patch: string, tables: string[]): Promise<void> {
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS _metadata (version TEXT, key TEXT, date INTEGER, PRIMARY KEY (version, key))",
    );

    for (const tableName of tables) {
      try {
        await this.importTable(patch, tableName);
      } catch (err) {
        console.warn(`Failed to process ${tableName}:`, err);
      }
    }
  }

  async importTable(patch: string, tableName: string): Promise<void> {
    if (!this.schema) await this.importSchema();
    if (!this.schema) throw new Error("Failed to load schema");

    const isPoE2 = patch.startsWith("4.");
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
          const res = await this.loader.getFileContents(patch, path);
          if (res) {
            content = res;
            usedExt = ext;
            console.log(`Found ${path}`);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!content) throw new Error(`File not found for ${tableName}`);
    if (!usedExt) throw new Error("File extension unknown");

    const datFile = readDatFile(usedExt, new Uint8Array(content.buffer));
    const headers = this.createHeaders(tableSchema);

    const validHeaders: Header[] = [];
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

    const colsData: { name: string; data: unknown[] }[] = [];
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
        type = "TEXT";
      } else if (
        c.type === "bool" ||
        c.type === "enumrow" ||
        c.type === "row" ||
        c.type === "foreignrow" ||
        c.type.startsWith("u") ||
        c.type.startsWith("i")
      ) {
        type = "INTEGER";
      } else if (c.type.startsWith("f")) {
        type = "REAL";
      }
      return `"${c.name}" ${type}`;
    });

    this.db.exec(`DROP TABLE IF EXISTS "${patch}_${tableName}"`);
    this.db.exec(
      `CREATE TABLE "${patch}_${tableName}" ("_index" INTEGER PRIMARY KEY, ${colDefs.join(", ")})`,
    );

    const rowCount = datFile.rowCount;
    const insertSql = `INSERT INTO "${patch}_${tableName}" ("_index", ${colsData.map((c) => `"${c.name}"`).join(", ")}) VALUES (?, ${colsData.map(() => "?").join(", ")})`;

    const allRows: unknown[][] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: unknown[] = [i];
      for (const col of colsData) {
        let val = col.data[i];
        if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
          val = JSON.stringify(val);
        }
        if (typeof val === "boolean") val = val ? 1 : 0;
        row.push(val);
      }
      allRows.push(row);
    }

    this.db.transaction(() => {
      for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
        const chunk = allRows.slice(i, i + CHUNK_SIZE);
        this.db.batchRun(insertSql, chunk);
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
  }): Header[] {
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
      offset += this.getHeaderLength(last);
    }
    return headers;
  }

  private getHeaderLength(header: Header): number {
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
}
