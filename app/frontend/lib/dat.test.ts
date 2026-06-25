import { beforeEach, describe, expect, it, vi } from "vitest";
import { TABLES } from "./queries";

vi.mock("pathofexile-dat-schema", () => ({
  SCHEMA_URL: "https://example.com/schema",
  ValidFor: { PoE1: 1, PoE2: 2 },
}));

vi.mock("pathofexile-dat/dat.js", () => ({
  readColumn: vi.fn(),
  readDatFile: vi.fn(),
}));

const mockQuery = vi.fn();
const mockExec = vi.fn();
const mockRun = vi.fn();
const mockInit = vi.fn();

vi.mock("./db", () => ({
  Database: vi.fn().mockImplementation(() => ({
    query: mockQuery,
    exec: mockExec,
    run: mockRun,
    init: mockInit,
  })),
}));

const mockGetAllKeys = vi.fn();
const mockDelete = vi.fn();
const mockIdbDelete = vi.fn();
const mockTxDone = Promise.resolve();
const mockIdbInstance = {
  getAllKeys: mockGetAllKeys,
  delete: mockIdbDelete,
  transaction: vi.fn().mockReturnValue({
    store: { delete: mockDelete },
    done: mockTxDone,
  }),
};

vi.mock("./idb", () => ({
  IDBManager: vi.fn().mockImplementation(() => ({
    getInstance: vi.fn().mockResolvedValue(mockIdbInstance),
  })),
}));

vi.mock("./bundle", () => ({
  BundleManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./art", () => ({
  ArtManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./wiki", () => ({
  WikiManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./minimap", () => ({
  MinimapManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./mods", () => ({
  ModManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./fetch", () => ({
  proxyFetch: vi.fn(),
}));

const { DatManager } = await import("./dat");

describe("DatManager.getStoredVersions", () => {
  let dat: InstanceType<typeof DatManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    dat = new DatManager();
  });

  it("returns distinct versions from _metadata ordered by version", async () => {
    mockQuery.mockResolvedValueOnce([
      { version: "3.25.3" },
      { version: "4.1.2" },
    ]);

    const versions = await dat.getStoredVersions();

    expect(versions).toEqual(["3.25.3", "4.1.2"]);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT DISTINCT version FROM _metadata ORDER BY version",
    );
  });

  it("returns empty array when no versions exist", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const versions = await dat.getStoredVersions();

    expect(versions).toEqual([]);
  });

  it("returns empty array when no versions exist", async () => {
    mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const versions = await dat.getStoredVersions();

    expect(versions).toEqual([]);
  });
});

describe("DatManager.dropVersion", () => {
  let dat: InstanceType<typeof DatManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    dat = new DatManager();
    mockQuery.mockResolvedValue([]);
  });

  it("drops all SQLite tables for the given patch", async () => {
    mockGetAllKeys.mockResolvedValue([]);

    await dat.dropVersion("4.1.2");

    for (const table of TABLES) {
      expect(mockExec).toHaveBeenCalledWith(
        `DROP TABLE IF EXISTS "4.1.2_${table}"`,
      );
    }
  });

  it("deletes metadata entries for the patch", async () => {
    mockGetAllKeys.mockResolvedValue([]);

    await dat.dropVersion("4.1.2");

    expect(mockRun).toHaveBeenCalledWith(
      "DELETE FROM _metadata WHERE version = ?",
      ["4.1.2"],
    );
  });

  it("removes IDB unique entries prefixed with the patch", async () => {
    mockGetAllKeys.mockResolvedValue([
      "4.1.2/Tabula Rasa",
      "4.1.2/Headhunter",
      "3.25.3/Tabula Rasa",
      "other-key",
    ]);

    await dat.dropVersion("4.1.2");

    expect(mockDelete).toHaveBeenCalledWith("4.1.2/Tabula Rasa");
    expect(mockDelete).toHaveBeenCalledWith("4.1.2/Headhunter");
    expect(mockDelete).not.toHaveBeenCalledWith("3.25.3/Tabula Rasa");
    expect(mockDelete).not.toHaveBeenCalledWith("other-key");
  });

  it("removes IDB bundle entries prefixed with the patch", async () => {
    mockGetAllKeys.mockResolvedValue([
      "4.1.2/_.index.bin",
      "4.1.2/Bundles2/Data.bundle.bin",
      "3.25.3/_.index.bin",
    ]);

    await dat.dropVersion("4.1.2");

    expect(mockDelete).toHaveBeenCalledWith("4.1.2/_.index.bin");
    expect(mockDelete).toHaveBeenCalledWith("4.1.2/Bundles2/Data.bundle.bin");
    expect(mockDelete).not.toHaveBeenCalledWith("3.25.3/_.index.bin");
  });

  it("deletes release data for items, mods and minimap", async () => {
    mockGetAllKeys.mockResolvedValue([]);

    await dat.dropVersion("4.1.2");

    expect(mockIdbDelete).toHaveBeenCalledWith(
      "items",
      "data-poe2-4.1.2/release",
    );
    expect(mockIdbDelete).toHaveBeenCalledWith(
      "mods",
      "data-poe2-4.1.2/release",
    );
    expect(mockIdbDelete).toHaveBeenCalledWith(
      "minimap",
      "data-poe2-4.1.2/release",
    );
  });
});

describe("DatManager.pruneVersions", () => {
  let dat: InstanceType<typeof DatManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    dat = new DatManager();
    mockQuery.mockResolvedValue([]);
  });

  it("keeps the newest 3 patches per game and drops the rest", async () => {
    mockGetAllKeys.mockImplementation((store: string) => {
      if (store === "bundles") {
        return Promise.resolve([
          "3.25.3/_.index.bin",
          "3.25.10/_.index.bin",
          "3.9.0/_.index.bin",
          "3.25.2/_.index.bin",
          "4.1.0/_.index.bin",
          "4.2.0/_.index.bin",
        ]);
      }
      return Promise.resolve([]);
    });

    const stale = await dat.pruneVersions();

    expect(stale).toEqual(["3.9.0"]);
    expect(mockRun).toHaveBeenCalledWith(
      "DELETE FROM _metadata WHERE version = ?",
      ["3.9.0"],
    );
  });

  it("includes patches found only in release item keys", async () => {
    mockGetAllKeys.mockImplementation((store: string) => {
      if (store === "items") {
        return Promise.resolve([
          "data-poe1-3.25.0/release",
          "data-poe1-3.25.1/release",
          "data-poe1-3.25.2/release",
          "data-poe1-3.25.3/release",
        ]);
      }
      return Promise.resolve([]);
    });

    const stale = await dat.pruneVersions();

    expect(stale).toEqual(["3.25.0"]);
  });

  it("drops nothing when under the limit", async () => {
    mockGetAllKeys.mockImplementation((store: string) => {
      if (store === "bundles") {
        return Promise.resolve(["3.25.3/_.index.bin", "4.2.0/_.index.bin"]);
      }
      return Promise.resolve([]);
    });

    const stale = await dat.pruneVersions();

    expect(stale).toEqual([]);
  });
});
