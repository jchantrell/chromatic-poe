import Database from "better-sqlite3";

export class NodeDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(":memory:");
    this.db.pragma("journal_mode = WAL");
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  query(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const stmt = this.db.prepare(sql);
    return (params.length ? stmt.all(...params) : stmt.all()) as Record<
      string,
      unknown
    >[];
  }

  run(sql: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(sql);
    params.length ? stmt.run(...params) : stmt.run();
  }

  batchRun(sql: string, paramsList: unknown[][]): void {
    const stmt = this.db.prepare(sql);
    const tx = this.db.transaction(() => {
      for (const params of paramsList) {
        stmt.run(...params);
      }
    });
    tx();
  }

  transaction(callback: () => void): void {
    this.db.transaction(callback)();
  }

  close(): void {
    this.db.close();
  }
}
