import { describe, expect, it, vi } from "vitest";

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

vi.mock("@app/lib/dat", () => ({ dat: {} }));
vi.mock("@app/lib/import", () => ({ importFilter: vi.fn() }));
vi.mock("@app/lib/items", () => ({ itemIndex: {} }));

import { removeCondition } from "@app/lib/commands";
import {
  ConditionKey,
  MissingUniquesCondition,
  UniqueTiersCondition,
  createCondition,
  type Conditions,
} from "@app/lib/condition";
import { Filter, type FilterRule } from "@app/lib/filter";

function createTestFilter(
  conditions: Conditions[] = [],
  bases: FilterRule["bases"] = [],
) {
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
        conditions,
        actions: {},
        bases,
        continue: false,
      },
    ],
  });
}

describe("removeCondition", () => {
  it("clears bases when removing a UniqueTiers condition", () => {
    const bases = [
      {
        name: "Headhunter",
        enabled: true,
        base: "Leather Belt",
        category: "Belts",
      },
      {
        name: "Mageblood",
        enabled: true,
        base: "Heavy Belt",
        category: "Belts",
      },
    ];
    const filter = createTestFilter(
      [new UniqueTiersCondition({ value: ["T1"], leagueSlug: "settlers" })],
      bases,
    );
    const rule = filter.rules[0];

    expect(rule.bases).toHaveLength(2);
    expect(rule.conditions).toHaveLength(1);

    removeCondition(filter, rule, rule.conditions[0]);

    expect(rule.conditions).toHaveLength(0);
    expect(rule.bases).toHaveLength(0);
  });

  it("clears bases when removing a MissingUniques condition", () => {
    const bases = [
      {
        name: "Headhunter",
        enabled: true,
        base: "Leather Belt",
        category: "Belts",
      },
    ];
    const filter = createTestFilter(
      [
        new MissingUniquesCondition({
          value: ["Belts"],
          leagueSlug: "settlers",
          display: "league",
        }),
      ],
      bases,
    );
    const rule = filter.rules[0];

    removeCondition(filter, rule, rule.conditions[0]);

    expect(rule.conditions).toHaveLength(0);
    expect(rule.bases).toHaveLength(0);
  });

  it("does not clear bases when removing a non-unique condition", () => {
    const bases = [
      {
        name: "Vaal Regalia",
        enabled: true,
        base: "Vaal Regalia",
        category: "Body Armour",
      },
    ];
    const filter = createTestFilter(
      [createCondition(ConditionKey.ITEM_LEVEL)],
      bases,
    );
    const rule = filter.rules[0];

    removeCondition(filter, rule, rule.conditions[0]);

    expect(rule.conditions).toHaveLength(0);
    expect(rule.bases).toHaveLength(1);
  });
});
