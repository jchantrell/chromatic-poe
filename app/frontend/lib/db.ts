import * as SQLite from "wa-sqlite";
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import wasmUrl from "wa-sqlite/dist/wa-sqlite-async.wasm?url";
// @ts-ignore
import { IDBBatchAtomicVFS } from "wa-sqlite/src/examples/IDBBatchAtomicVFS.js";
import { to } from "./utils";

class Mutex {
  private mutex = Promise.resolve();

  lock(): PromiseLike<() => void> {
    let begin: (unlock: () => void) => void = (_unlock) => {};

    this.mutex = this.mutex.then(() => {
      return new Promise(begin);
    });

    return new Promise((res) => {
      begin = res;
    });
  }

  async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}

export class Database {
  sqlite3: SQLiteAPI | null = null;
  db: number | null = null;
  private initPromise: Promise<void> | null = null;
  private mutex = new Mutex();

  async init() {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.mutex.dispatch(async () => {
        const module = await SQLiteESMFactory({
          locateFile: () => wasmUrl,
        });
        this.sqlite3 = SQLite.Factory(module);

        const vfs = new IDBBatchAtomicVFS("chromatic-poe-db");
        await vfs.isReady;

        this.sqlite3.vfs_register(vfs, true);

        this.db = await this.sqlite3.open_v2(
          "chromatic.db",
          SQLite.SQLITE_OPEN_READWRITE |
            SQLite.SQLITE_OPEN_CREATE |
            SQLite.SQLITE_OPEN_URI,
          vfs.name,
        );
      });
    })();

    await this.initPromise;
  }

  async exec(sql: string) {
    return this.mutex.dispatch(async () => {
      if (!this.sqlite3 || !this.db) throw new Error("DB not initialized");
      await this.sqlite3.exec(this.db, sql);
    });
  }

  async query(
    sql: string,
    params: SQLiteCompatibleType[] = [],
  ): Promise<Record<string, unknown>[]> {
    return this.mutex.dispatch(async () => {
      if (!this.sqlite3 || !this.db) throw new Error("DB not initialized");

      const str = this.sqlite3.str_new(this.db);
      this.sqlite3.str_appendall(str, sql);
      const prepared = await this.sqlite3.prepare_v2(
        this.db,
        this.sqlite3.str_value(str),
      );
      this.sqlite3.str_finish(str);

      if (!prepared) return [];

      try {
        if (params.length > 0) {
          this.sqlite3.bind_collection(prepared.stmt, params);
        }

        const results = [];
        const columnCount = this.sqlite3.column_count(prepared.stmt);
        const columnNames = [];
        for (let i = 0; i < columnCount; i++) {
          columnNames.push(this.sqlite3.column_name(prepared.stmt, i));
        }

        while ((await this.sqlite3.step(prepared.stmt)) === SQLite.SQLITE_ROW) {
          const row: Record<string, unknown> = {};
          for (let i = 0; i < columnCount; i++) {
            const name = columnNames[i];
            const type = this.sqlite3.column_type(prepared.stmt, i);
            let value: number | string | null;
            switch (type) {
              case SQLite.SQLITE_INTEGER:
                value = this.sqlite3.column_int(prepared.stmt, i);
                break;
              case SQLite.SQLITE_FLOAT:
                value = this.sqlite3.column_double(prepared.stmt, i);
                break;
              case SQLite.SQLITE_TEXT:
                value = this.sqlite3.column_text(prepared.stmt, i);
                break;
              case SQLite.SQLITE_NULL:
                value = null;
                break;
              default:
                value = this.sqlite3.column_text(prepared.stmt, i);
            }
            row[name] = value;
          }
          results.push(row);
        }
        return results;
      } finally {
        await this.sqlite3.finalize(prepared.stmt);
      }
    });
  }

  async run(sql: string, params: SQLiteCompatibleType[] = []) {
    return this.mutex.dispatch(async () => {
      if (!this.sqlite3 || !this.db) throw new Error("DB not initialized");
      const str = this.sqlite3.str_new(this.db);
      this.sqlite3.str_appendall(str, sql);
      const prepared = await this.sqlite3.prepare_v2(
        this.db,
        this.sqlite3.str_value(str),
      );
      this.sqlite3.str_finish(str);

      if (!prepared) return;

      try {
        if (params.length > 0) {
          this.sqlite3.bind_collection(prepared.stmt, params);
        }
        await this.sqlite3.step(prepared.stmt);
      } finally {
        await this.sqlite3.finalize(prepared.stmt);
      }
    });
  }

  async batchRun(sql: string, paramsList: SQLiteCompatibleType[][]) {
    return this.mutex.dispatch(async () => {
      if (!this.sqlite3 || !this.db) throw new Error("DB not initialized");
      const str = this.sqlite3.str_new(this.db);
      this.sqlite3.str_appendall(str, sql);
      const prepared = await this.sqlite3.prepare_v2(
        this.db,
        this.sqlite3.str_value(str),
      );
      this.sqlite3.str_finish(str);

      if (!prepared) return;

      try {
        for (const params of paramsList) {
          this.sqlite3.reset(prepared.stmt);
          this.sqlite3.bind_collection(prepared.stmt, params);
          await this.sqlite3.step(prepared.stmt);
        }
      } finally {
        await this.sqlite3.finalize(prepared.stmt);
      }
    });
  }

  async transaction(callback: () => Promise<void>) {
    await this.exec("BEGIN TRANSACTION");

    const [err] = await to(
      (async () => {
        await callback();
        await this.exec("COMMIT");
      })(),
    );

    if (err) {
      await this.exec("ROLLBACK");
      throw err;
    }
  }

  async close() {
    if (this.sqlite3 && this.db) {
      await this.sqlite3.close(this.db);
    }
  }
}
