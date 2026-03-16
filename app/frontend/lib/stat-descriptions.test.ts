import { describe, expect, it } from "vitest";
import {
  parseStatDescriptionFile,
  formatStatDescription,
  parseMatcher,
  matchesValue,
  parseConditionLine,
} from "./stat-descriptions";

describe("parseMatcher", () => {
  it("parses # as any", () => {
    expect(parseMatcher("#")).toEqual({ type: "any" });
  });

  it("parses exact values", () => {
    expect(parseMatcher("5")).toEqual({ type: "exact", value: 5 });
    expect(parseMatcher("-1")).toEqual({ type: "exact", value: -1 });
    expect(parseMatcher("0")).toEqual({ type: "exact", value: 0 });
  });

  it("parses ranges", () => {
    expect(parseMatcher("1|#")).toEqual({ type: "range", min: 1, max: null });
    expect(parseMatcher("#|-1")).toEqual({ type: "range", min: null, max: -1 });
    expect(parseMatcher("1|100")).toEqual({ type: "range", min: 1, max: 100 });
    expect(parseMatcher("-99|-1")).toEqual({
      type: "range",
      min: -99,
      max: -1,
    });
  });

  it("parses not-equal", () => {
    expect(parseMatcher("!0")).toEqual({ type: "not", value: 0 });
  });
});

describe("matchesValue", () => {
  it("any matches everything", () => {
    expect(matchesValue({ type: "any" }, 0)).toBe(true);
    expect(matchesValue({ type: "any" }, -100)).toBe(true);
    expect(matchesValue({ type: "any" }, 999)).toBe(true);
  });

  it("exact matches only the value", () => {
    expect(matchesValue({ type: "exact", value: 5 }, 5)).toBe(true);
    expect(matchesValue({ type: "exact", value: 5 }, 4)).toBe(false);
  });

  it("range matches within bounds", () => {
    expect(matchesValue({ type: "range", min: 1, max: null }, 1)).toBe(true);
    expect(matchesValue({ type: "range", min: 1, max: null }, 100)).toBe(true);
    expect(matchesValue({ type: "range", min: 1, max: null }, 0)).toBe(false);
    expect(matchesValue({ type: "range", min: null, max: -1 }, -1)).toBe(true);
    expect(matchesValue({ type: "range", min: null, max: -1 }, -50)).toBe(true);
    expect(matchesValue({ type: "range", min: null, max: -1 }, 0)).toBe(false);
    expect(matchesValue({ type: "range", min: 1, max: 100 }, 50)).toBe(true);
    expect(matchesValue({ type: "range", min: 1, max: 100 }, 101)).toBe(false);
  });

  it("not matches everything except the value", () => {
    expect(matchesValue({ type: "not", value: 0 }, 1)).toBe(true);
    expect(matchesValue({ type: "not", value: 0 }, 0)).toBe(false);
  });
});

describe("parseConditionLine", () => {
  it("parses a simple single-stat condition", () => {
    const result = parseConditionLine('1|# "{0}% increased Attack Speed"', 1);
    expect(result).not.toBeNull();
    expect(result!.matchers).toHaveLength(1);
    expect(result!.matchers[0]).toEqual({ type: "range", min: 1, max: null });
    expect(result!.template).toBe("{0}% increased Attack Speed");
    expect(result!.handlers).toHaveLength(0);
  });

  it("parses a condition with negate handler", () => {
    const result = parseConditionLine(
      '#|-1 "{0}% reduced Attack Speed" negate 1',
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.matchers[0]).toEqual({ type: "range", min: null, max: -1 });
    expect(result!.template).toBe("{0}% reduced Attack Speed");
    expect(result!.handlers).toHaveLength(1);
  });

  it("parses a multi-stat condition", () => {
    const result = parseConditionLine(
      '# # "Adds {0} to {1} Physical Damage"',
      2,
    );
    expect(result).not.toBeNull();
    expect(result!.matchers).toHaveLength(2);
    expect(result!.template).toBe("Adds {0} to {1} Physical Damage");
  });

  it("parses condition with per_minute_to_per_second", () => {
    const result = parseConditionLine(
      '# "Regenerate {0}% of Life per second" per_minute_to_per_second 1',
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.handlers).toHaveLength(1);
    // Apply handler: 600 per minute -> 10 per second
    const vals = result!.handlers[0]([600]);
    expect(vals[0]).toBe(10);
  });

  it("parses condition with milliseconds_to_seconds", () => {
    const result = parseConditionLine(
      '# "Gain Onslaught for {0} seconds" milliseconds_to_seconds 1',
      1,
    );
    expect(result).not.toBeNull();
    const vals = result!.handlers[0]([4000]);
    expect(vals[0]).toBe(4);
  });

  it("parses condition with divide_by_one_hundred", () => {
    const result = parseConditionLine(
      '# "Gems have {0:+d}% Critical Strike Chance" divide_by_one_hundred 1',
      1,
    );
    expect(result).not.toBeNull();
    const vals = result!.handlers[0]([350]);
    expect(vals[0]).toBe(3.5);
  });

  it("ignores reminderstring tokens", () => {
    const result = parseConditionLine(
      '# "Gain Onslaught for {0} seconds" milliseconds_to_seconds 1 reminderstring ReminderTextOnslaught',
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.handlers).toHaveLength(1);
  });
});

describe("parseStatDescriptionFile", () => {
  it("parses a simple single-stat section", () => {
    const content = [
      "description",
      "\t1 base_maximum_life",
      "\t1",
      '\t\t# "{0:+d} to maximum Life"',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["base_maximum_life"]).toBeDefined();
    expect(result["base_maximum_life"].statIds).toEqual(["base_maximum_life"]);
    expect(result["base_maximum_life"].conditions).toHaveLength(1);
    expect(result["base_maximum_life"].conditions[0].template).toBe(
      "{0:+d} to maximum Life",
    );
  });

  it("parses a section with increased/reduced variants", () => {
    const content = [
      "description",
      "\t1 local_attack_speed_+%",
      "\t2",
      '\t\t1|# "{0}% increased Attack Speed"',
      '\t\t#|-1 "{0}% reduced Attack Speed" negate 1',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    const entry = result["local_attack_speed_+%"];
    expect(entry.conditions).toHaveLength(2);
    expect(entry.conditions[0].template).toBe("{0}% increased Attack Speed");
    expect(entry.conditions[1].template).toBe("{0}% reduced Attack Speed");
  });

  it("parses a two-stat section", () => {
    const content = [
      "description",
      "\t2 local_minimum_added_physical_damage local_maximum_added_physical_damage",
      "\t1",
      '\t\t# # "Adds {0} to {1} Physical Damage"',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["local_minimum_added_physical_damage"]).toBeDefined();
    expect(result["local_maximum_added_physical_damage"]).toBeDefined();
    expect(result["local_minimum_added_physical_damage"]).toBe(
      result["local_maximum_added_physical_damage"],
    );
    expect(
      result["local_minimum_added_physical_damage"].conditions[0].template,
    ).toBe("Adds {0} to {1} Physical Damage");
  });

  it("skips non-English language blocks", () => {
    const content = [
      "description",
      "\t1 base_maximum_life",
      "\t1",
      '\t\t# "{0:+d} to maximum Life"',
      '\tlang "Thai"',
      "\t1",
      '\t\t# "{0:+d} ชีวิตสูงสุด"',
      '\tlang "Spanish"',
      "\t1",
      '\t\t# "{0:+d} a la vida máxima"',
      "",
      "description",
      "\t1 attack_speed_+%",
      "\t1",
      '\t\t# "{0}% increased Attack Speed"',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["base_maximum_life"]).toBeDefined();
    expect(result["base_maximum_life"].conditions).toHaveLength(1);
    expect(result["base_maximum_life"].conditions[0].template).toBe(
      "{0:+d} to maximum Life",
    );
    expect(result["attack_speed_+%"]).toBeDefined();
  });

  it("parses no_description entries", () => {
    const content = [
      "no_description level",
      "no_description item_drop_slots",
      "description",
      "\t1 base_maximum_life",
      "\t1",
      '\t\t# "{0:+d} to maximum Life"',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["level"]).toBeDefined();
    expect(result["level"].conditions).toHaveLength(0);
    expect(result["item_drop_slots"]).toBeDefined();
    expect(result["base_maximum_life"]).toBeDefined();
  });

  it("parses multiple sections", () => {
    const content = [
      "description",
      "\t1 stat_a",
      "\t1",
      '\t\t# "{0} stat A"',
      "",
      "description",
      "\t1 stat_b",
      "\t2",
      '\t\t1|# "{0}% increased B"',
      '\t\t#|-1 "{0}% reduced B" negate 1',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["stat_a"]).toBeDefined();
    expect(result["stat_b"]).toBeDefined();
    expect(result["stat_b"].conditions).toHaveLength(2);
  });

  it("parses complex multi-stat section with exact matchers", () => {
    const content = [
      "description",
      "\t2 stat_min stat_max",
      "\t4",
      '\t\t0 1 "up to {1} Spirit"',
      '\t\t0 # "up to {1} Spirits"',
      '\t\t1 1 "{0} Spirit"',
      '\t\t# # "{0} to {1} Spirits"',
    ].join("\n");

    const result = parseStatDescriptionFile(content);
    expect(result["stat_min"].conditions).toHaveLength(4);
    expect(result["stat_min"].conditions[0].matchers).toEqual([
      { type: "exact", value: 0 },
      { type: "exact", value: 1 },
    ]);
  });
});

describe("formatStatDescription", () => {
  it("formats a simple stat with +d", () => {
    const content = [
      "description",
      "\t1 base_maximum_life",
      "\t1",
      '\t\t# "{0:+d} to maximum Life"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["base_maximum_life"], [
      [50, 50],
    ]);
    expect(result).toBe("+50 to maximum Life");
  });

  it("formats a range of values", () => {
    const content = [
      "description",
      "\t1 base_maximum_life",
      "\t1",
      '\t\t# "{0:+d} to maximum Life"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["base_maximum_life"], [
      [40, 50],
    ]);
    expect(result).toBe("+(40-50) to maximum Life");
  });

  it("selects correct condition for positive values", () => {
    const content = [
      "description",
      "\t1 local_attack_speed_+%",
      "\t2",
      '\t\t1|# "{0}% increased Attack Speed"',
      '\t\t#|-1 "{0}% reduced Attack Speed" negate 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["local_attack_speed_+%"], [
      [15, 20],
    ]);
    expect(result).toBe("(15-20)% increased Attack Speed");
  });

  it("selects correct condition for negative values and negates", () => {
    const content = [
      "description",
      "\t1 local_attack_speed_+%",
      "\t2",
      '\t\t1|# "{0}% increased Attack Speed"',
      '\t\t#|-1 "{0}% reduced Attack Speed" negate 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["local_attack_speed_+%"], [
      [-10, -10],
    ]);
    expect(result).toBe("10% reduced Attack Speed");
  });

  it("formats two-stat adds X to Y damage", () => {
    const content = [
      "description",
      "\t2 local_minimum_added_physical_damage local_maximum_added_physical_damage",
      "\t1",
      '\t\t# # "Adds {0} to {1} Physical Damage"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(
      lookup["local_minimum_added_physical_damage"],
      [
        [10, 15],
        [20, 25],
      ],
    );
    expect(result).toBe("Adds (10-15) to (20-25) Physical Damage");
  });

  it("formats two-stat with fixed values", () => {
    const content = [
      "description",
      "\t2 local_minimum_added_physical_damage local_maximum_added_physical_damage",
      "\t1",
      '\t\t# # "Adds {0} to {1} Physical Damage"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(
      lookup["local_minimum_added_physical_damage"],
      [
        [10, 10],
        [20, 20],
      ],
    );
    expect(result).toBe("Adds 10 to 20 Physical Damage");
  });

  it("applies per_minute_to_per_second handler", () => {
    const content = [
      "description",
      "\t1 life_regen_per_minute_%",
      "\t1",
      '\t\t1|# "Regenerate {0}% of Life per second" per_minute_to_per_second 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["life_regen_per_minute_%"], [
      [600, 600],
    ]);
    expect(result).toBe("Regenerate 10% of Life per second");
  });

  it("applies milliseconds_to_seconds handler", () => {
    const content = [
      "description",
      "\t1 onslaught_duration_ms",
      "\t1",
      '\t\t# "Gain Onslaught for {0} seconds" milliseconds_to_seconds 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["onslaught_duration_ms"], [
      [4000, 4000],
    ]);
    expect(result).toBe("Gain Onslaught for 4 seconds");
  });

  it("applies divide_by_one_hundred handler", () => {
    const content = [
      "description",
      "\t1 crit_chance",
      "\t1",
      '\t\t# "Gems have {0:+d}% Critical Strike Chance" divide_by_one_hundred 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["crit_chance"], [[350, 350]]);
    expect(result).toBe("Gems have +3.5% Critical Strike Chance");
  });

  it("returns empty string for no_description entries", () => {
    const content = "no_description level";
    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["level"], [[1, 1]]);
    expect(result).toBe("");
  });

  it("selects correct condition with exact matchers", () => {
    const content = [
      "description",
      "\t1 jewel_radius",
      "\t3",
      '\t\t1 "Small Ring"',
      '\t\t2 "Medium Ring"',
      '\t\t3 "Large Ring"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    expect(formatStatDescription(lookup["jewel_radius"], [[1, 1]])).toBe(
      "Small Ring",
    );
    expect(formatStatDescription(lookup["jewel_radius"], [[2, 2]])).toBe(
      "Medium Ring",
    );
    expect(formatStatDescription(lookup["jewel_radius"], [[3, 3]])).toBe(
      "Large Ring",
    );
  });

  it("handles negative value with +d format", () => {
    const content = [
      "description",
      "\t1 some_stat",
      "\t1",
      '\t\t# "{0:+d} to something"',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);
    const result = formatStatDescription(lookup["some_stat"], [[-5, -5]]);
    expect(result).toBe("-5 to something");
  });

  it("handles physical damage with no_physical_damage condition", () => {
    const content = [
      "description",
      "\t2 local_physical_damage_+% local_weapon_no_physical_damage",
      "\t5",
      '\t\t# 1|# "No Physical Damage"',
      '\t\t# #|-1 "No Physical Damage"',
      '\t\t#|-100 # "No Physical Damage"',
      '\t\t1|# 0 "{0}% increased Physical Damage" canonical_line',
      '\t\t-99|-1 0 "{0}% reduced Physical Damage" negate 1',
    ].join("\n");

    const lookup = parseStatDescriptionFile(content);

    const increased = formatStatDescription(
      lookup["local_physical_damage_+%"],
      [
        [170, 179],
        [0, 0],
      ],
    );
    expect(increased).toBe("(170-179)% increased Physical Damage");

    const reduced = formatStatDescription(lookup["local_physical_damage_+%"], [
      [-20, -20],
      [0, 0],
    ]);
    expect(reduced).toBe("20% reduced Physical Damage");

    const noPhys = formatStatDescription(lookup["local_physical_damage_+%"], [
      [100, 100],
      [1, 1],
    ]);
    expect(noPhys).toBe("No Physical Damage");
  });
});
