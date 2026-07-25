import type { FilterItem, Item } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { describe, expect, it } from "vitest";

function item(name: string, category: string): Item {
  return {
    name,
    base: name,
    category,
    enabled: true,
    itemClass: category,
    art: "",
    class: category,
    type: "",
    score: 0,
    height: 1,
    width: 1,
    dropLevel: 1,
  };
}

function base(name: string, category: string): FilterItem {
  return { name, base: name, category, enabled: true };
}

describe("itemIndex.findRemoved", () => {
  it("returns bases the loaded patch no longer contains", () => {
    itemIndex.initV2([item("Chaos Orb", "Currency")], "4.1.0");

    const removed = itemIndex.findRemoved([
      base("Chaos Orb", "Currency"),
      base("Scroll of Wisdom", "Currency"),
    ]);

    expect(removed.map((b) => b.name)).toEqual(["Scroll of Wisdom"]);
  });

  it("keeps bases that only changed category", () => {
    itemIndex.initV2([item("Chaos Orb", "Stackable Currency")], "4.1.0");

    expect(itemIndex.findRemoved([base("Chaos Orb", "Currency")])).toEqual([]);
  });

  it("reports nothing when the index is empty", () => {
    itemIndex.initV2([], "4.1.0");

    expect(itemIndex.findRemoved([base("Chaos Orb", "Currency")])).toEqual([]);
  });
});
