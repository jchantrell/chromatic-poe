import { describe, expect, it } from "vitest";
import { modIndex, enchantIndex, type Mod } from "./mods";

describe("ModIndex", () => {
  it("includes mods without bases in search results", () => {
    const mods: Mod[] = [
      {
        name: "Korell's Veiled",
        id: "KeemaVeiledPrefix_",
        tags: [],
        type: "veiled",
        position: "prefix",
        bases: [],
        stats: [[{ label: "Veiled Prefix", description: "Veiled Prefix" }]],
        domain: 26,
      },
      {
        name: "Tyrannical",
        id: "LocalIncreasedPhysicalDamagePercent7",
        tags: ["physical"],
        type: "physical_damage",
        position: "prefix",
        bases: ["Corsair Sword"],
        stats: [
          [
            {
              label: "Increased Physical Damage",
              description: "+(170-179)% increased Physical Damage",
            },
          ],
        ],
        domain: 1,
      },
    ];

    modIndex.init(mods);
    const results = modIndex.search("Korell");
    const names = results.map((r) => r.item.name);
    expect(names).toContain("Korell's Veiled");
  });

  it("includes veiled suffix mods", () => {
    const mods: Mod[] = [
      {
        name: "of the Veil",
        id: "VeiledSuffix",
        tags: [],
        type: "veiled",
        position: "suffix",
        bases: [],
        stats: [[{ label: "Veiled Suffix", description: "Veiled Suffix" }]],
        domain: 26,
      },
    ];

    modIndex.init(mods);
    const results = modIndex.search("Veil");
    const names = results.map((r) => r.item.name);
    expect(names).toContain("of the Veil");
  });

  it("returns all mods on empty search including baseless mods", () => {
    const mods: Mod[] = [
      {
        name: "Korell's Veiled",
        id: "KeemaVeiledPrefix_",
        tags: [],
        type: "veiled",
        position: "prefix",
        bases: [],
        stats: [[{ label: "Veiled Prefix", description: "Veiled Prefix" }]],
      },
      {
        name: "Tyrannical",
        id: "LocalIncreasedPhysicalDamagePercent7",
        tags: ["physical"],
        type: "physical_damage",
        position: "prefix",
        bases: ["Corsair Sword"],
        stats: [
          [
            {
              label: "Increased Physical Damage",
              description: "+(170-179)% increased Physical Damage",
            },
          ],
        ],
      },
    ];

    modIndex.init(mods);
    const results = modIndex.search("");
    const names = results.map((r) => r.item.name);
    expect(names).toContain("Korell's Veiled");
    expect(names).toContain("Tyrannical");
  });

  it("excludes enchant-positioned mods", () => {
    const mods: Mod[] = [
      {
        name: "Some Enchant",
        id: "enchant1",
        tags: [],
        type: "enchant_type",
        position: "enchant",
        bases: [],
        stats: [[{ label: "Enchant", description: "Enchant" }]],
      },
    ];

    modIndex.init(mods);
    const results = modIndex.search("");
    expect(results).toHaveLength(0);
  });
});

describe("EnchantIndex", () => {
  it("only includes enchant-positioned mods", () => {
    const mods: Mod[] = [
      {
        name: "Some Enchant",
        id: "enchant1",
        tags: [],
        type: "enchant_type",
        position: "enchant",
        bases: [],
        stats: [[{ label: "Enchant", description: "Enchant" }]],
      },
      {
        name: "Tyrannical",
        id: "prefix1",
        tags: [],
        type: "physical_damage",
        position: "prefix",
        bases: ["Corsair Sword"],
        stats: [
          [
            {
              label: "Increased Physical Damage",
              description: "+(170-179)% increased Physical Damage",
            },
          ],
        ],
      },
    ];

    enchantIndex.init(mods);
    const results = enchantIndex.search("");
    const names = results.map((r) => r.item.name);
    expect(names).toContain("Some Enchant");
    expect(names).not.toContain("Tyrannical");
  });
});
