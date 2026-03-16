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
