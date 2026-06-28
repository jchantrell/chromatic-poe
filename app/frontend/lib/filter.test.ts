import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@app/lib/config", () => {
  const saveFilter = vi.fn().mockResolvedValue(undefined);
  const writeFilter = vi.fn().mockResolvedValue(undefined);
  const obj = {
    runtime: "desktop",
    saveFilter,
    writeFilter,
    eol: () => "\n",
  };
  return { default: obj, chromatic: obj };
});

vi.mock("@app/store", () => {
  const state = { autosave: false };
  return {
    store: state,
    setAutosave: (v: boolean) => {
      state.autosave = v;
    },
  };
});

vi.mock("solid-js/store", () => ({
  createMutable: <T>(obj: T) => obj,
  modifyMutable: <T>(target: T, fn: (prev: T) => T) => {
    const result = fn(target);
    Object.assign(target as object, result);
  },
  reconcile:
    <T>(next: T) =>
    () =>
      next,
  unwrap: <T>(obj: T) => obj,
}));

vi.mock("solid-sonner", () => ({
  toast: Object.assign(vi.fn(), { promise: vi.fn(), error: vi.fn() }),
}));

vi.mock("./dat", () => ({ dat: {} }));
vi.mock("./import", () => ({ importFilter: vi.fn() }));
vi.mock("./items", () => ({ itemIndex: {} }));

import chromatic from "@app/lib/config";
import { store } from "@app/store";
import { Command } from "./commands";
import { Filter } from "./filter";

function createTestFilter() {
  return new Filter({
    name: "test",
    chromaticVersion: "1.0.0",
    poeVersion: 2,
    poePatch: "4.0.0",
    lastUpdated: new Date("2025-01-01"),
    rules: [
      {
        id: "rule-1",
        name: "Test Rule",
        type: "standard",
        show: true,
        enabled: true,
        conditions: [],
        actions: {},
        bases: [
          {
            name: "Vaal Regalia",
            enabled: true,
            base: "Vaal Regalia",
            category: "Body Armour",
          },
        ],
        continue: false,
      },
    ],
  });
}

function toggleBaseCommand(filter: Filter) {
  return new Command(() => {
    filter.rules[0].bases[0].enabled = !filter.rules[0].bases[0].enabled;
  });
}

describe("Filter.scheduleAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.autosave = false;
    vi.mocked(chromatic.saveFilter).mockClear();
    vi.mocked(chromatic.writeFilter).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not autosave when disabled", () => {
    const filter = createTestFilter();
    filter.execute(toggleBaseCommand(filter));

    vi.advanceTimersByTime(3000);

    expect(chromatic.saveFilter).not.toHaveBeenCalled();
    expect(chromatic.writeFilter).not.toHaveBeenCalled();
  });

  it("autosaves after delay when enabled", async () => {
    store.autosave = true;
    const filter = createTestFilter();
    filter.execute(toggleBaseCommand(filter));

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(chromatic.saveFilter).toHaveBeenCalledWith(filter, true);
    expect(chromatic.writeFilter).toHaveBeenCalledWith(filter, true);
  });

  it("debounces rapid commands into a single autosave", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.execute(toggleBaseCommand(filter));
    vi.advanceTimersByTime(500);
    filter.execute(toggleBaseCommand(filter));
    vi.advanceTimersByTime(500);
    filter.execute(toggleBaseCommand(filter));

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(chromatic.saveFilter).toHaveBeenCalledTimes(1);
    expect(chromatic.writeFilter).toHaveBeenCalledTimes(1);
  });

  it("triggers autosave after undo", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.execute(toggleBaseCommand(filter));
    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();
    vi.mocked(chromatic.saveFilter).mockClear();
    vi.mocked(chromatic.writeFilter).mockClear();

    filter.undo();
    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(chromatic.saveFilter).toHaveBeenCalledWith(filter, true);
  });

  it("triggers autosave after redo", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.execute(toggleBaseCommand(filter));
    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    filter.undo();
    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();
    vi.mocked(chromatic.saveFilter).mockClear();
    vi.mocked(chromatic.writeFilter).mockClear();

    filter.redo();
    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(chromatic.saveFilter).toHaveBeenCalledWith(filter, true);
  });

  it("logs errors from autosave without throwing", async () => {
    store.autosave = true;
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(chromatic.saveFilter).mockRejectedValueOnce(
      new Error("IDB write failed"),
    );

    const filter = createTestFilter();
    filter.execute(toggleBaseCommand(filter));

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Autosave failed"),
      expect.any(Error),
    );
    consoleError.mockRestore();
  });

  it("flushes pending autosave immediately via flushAutosave", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.execute(toggleBaseCommand(filter));
    await filter.flushAutosave();

    expect(chromatic.saveFilter).toHaveBeenCalledWith(filter, true);
  });
});

describe("Filter batching", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.autosave = false;
    vi.mocked(chromatic.saveFilter).mockClear();
    vi.mocked(chromatic.writeFilter).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("batches direct mutations into one undo entry and one autosave", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    for (let i = 1; i <= 25; i++) {
      filter.beginBatch();
      filter.rules[0].actions.fontSize = i;
    }

    expect(filter.undoStack).toHaveLength(0);
    expect(chromatic.saveFilter).not.toHaveBeenCalled();

    filter.commitBatch();
    expect(filter.undoStack).toHaveLength(1);

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(chromatic.saveFilter).toHaveBeenCalledTimes(1);
    expect(chromatic.writeFilter).toHaveBeenCalledTimes(1);
  });

  it("undoes an entire batch in one step", () => {
    const filter = createTestFilter();

    filter.beginBatch();
    filter.rules[0].actions.fontSize = 10;
    filter.rules[0].actions.fontSize = 20;
    filter.commitBatch();

    filter.undo();

    expect(filter.rules[0].actions.fontSize).toBeUndefined();
    expect(filter.undoStack).toHaveLength(0);
  });

  it("does nothing on commitBatch without an open batch", () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.commitBatch();
    vi.advanceTimersByTime(3000);

    expect(filter.undoStack).toHaveLength(0);
    expect(chromatic.saveFilter).not.toHaveBeenCalled();
  });

  it("does nothing on commit of a batch with no changes", () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.beginBatch();
    filter.commitBatch();
    vi.advanceTimersByTime(3000);

    expect(filter.undoStack).toHaveLength(0);
    expect(chromatic.saveFilter).not.toHaveBeenCalled();
  });

  it("commits an open batch when flushing autosave", async () => {
    store.autosave = true;
    const filter = createTestFilter();

    filter.beginBatch();
    filter.rules[0].actions.fontSize = 5;
    await filter.flushAutosave();

    expect(filter.undoStack).toHaveLength(1);
    expect(chromatic.saveFilter).toHaveBeenCalledWith(filter, true);
  });

  it("caps the undo stack length", () => {
    const filter = createTestFilter();

    for (let i = 0; i < 105; i++) {
      filter.execute(toggleBaseCommand(filter));
    }

    expect(filter.undoStack).toHaveLength(100);
  });
});

describe("Filter dirty tracking", () => {
  beforeEach(() => {
    store.autosave = false;
    vi.mocked(chromatic.saveFilter).mockClear();
  });

  it("is not dirty when freshly created", () => {
    expect(createTestFilter().dirty).toBe(false);
  });

  it("marks dirty on a command that changes state", () => {
    const filter = createTestFilter();
    filter.execute(toggleBaseCommand(filter));
    expect(filter.dirty).toBe(true);
  });

  it("marks dirty when a batch begins", () => {
    const filter = createTestFilter();
    filter.beginBatch();
    expect(filter.dirty).toBe(true);
  });

  it("clears dirty on save", async () => {
    const filter = createTestFilter();
    filter.beginBatch();
    expect(filter.dirty).toBe(true);
    await filter.save();
    expect(filter.dirty).toBe(false);
  });
});
