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
const mockTxDone = Promise.resolve();
const mockIdbInstance = {
  getAllKeys: mockGetAllKeys,
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
});
