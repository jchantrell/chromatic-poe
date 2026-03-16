import type { Color, IconSize, Shape } from "@app/lib/action";
import { convertRawToConditions } from "@app/lib/condition";
import type {
  Filter,
  FilterItem,
  FilterRule,
  UniqueCollectionDisplay,
  UniqueCollectionRule,
} from "@app/lib/filter";
import type { PoeladderUnique } from "@app/lib/poeladder";
import { clone } from "@app/lib/utils";
import { ulid } from "ulid";

export class Command {
  execute: (...args: unknown[]) => unknown;
  constructor(execute: (...args: unknown[]) => unknown) {
    this.execute = execute;
  }
}

export function setBeamColor(filter: Filter, rule: FilterRule, color: Color) {
  filter.execute(
    new Command(() => {
      if (rule.actions.beam) {
        rule.actions.beam.color = color;
      }
    }),
  );
}

export function setBeamTemp(filter: Filter, rule: FilterRule, temp: boolean) {
  filter.execute(
    new Command(() => {
      if (rule.actions.beam) {
        rule.actions.beam.temp = temp;
      }
    }),
  );
}

export function setBeamEnabled(
  filter: Filter,
  rule: FilterRule,
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.beam) {
        rule.actions.beam.enabled = enabled;
      }
    }),
  );
}

export function setSoundEnabled(
  filter: Filter,
  rule: FilterRule,
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (!rule.actions.sound) {
        rule.actions.sound = {
          enabled: enabled,
          path: { value: "1", type: "default" },
          volume: 100,
        };
      }
      if (rule.actions.sound) {
        rule.actions.sound.enabled = enabled;
      }
    }),
  );
}

export function setDropSoundEnabled(
  filter: Filter,
  rule: FilterRule,
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.dropSound) {
        rule.actions.dropSound.enabled = enabled;
      }
    }),
  );
}

export function setDropSoundToggle(
  filter: Filter,
  rule: FilterRule,
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.dropSound) {
        rule.actions.dropSound.toggle = enabled;
      }
    }),
  );
}

export function setSoundPath(
  filter: Filter,
  rule: FilterRule,
  path: { value: string; path: string; type: "custom" | "default" },
) {
  filter.execute(
    new Command(() => {
      if (!rule.actions.sound) {
        rule.actions.sound = {
          enabled: true,
          path: { value: "1", path: "", type: "default" },
          volume: 100,
        };
      }
      if (rule.actions.sound) {
        rule.actions.sound.path = path;
      }
    }),
  );
}

export function setSoundVolume(
  filter: Filter,
  rule: FilterRule,
  volume: number,
) {
  filter.execute(
    new Command(() => {
      if (!rule.actions.sound) {
        rule.actions.sound = {
          enabled: true,
          path: { value: "1", type: "default" },
          volume: 100,
        };
      }
      if (rule.actions.sound) {
        rule.actions.sound.volume = volume;
      }
    }),
  );
}

export function setMapIconSize(
  filter: Filter,
  rule: FilterRule,
  size: IconSize,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.icon) {
        rule.actions.icon.size = size;
      }
    }),
  );
}

export function setMapIconColor(
  filter: Filter,
  rule: FilterRule,
  color: Color,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.icon) {
        rule.actions.icon.color = color;
      }
    }),
  );
}

export function setMapIconShape(
  filter: Filter,
  rule: FilterRule,
  shape: Shape,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.icon) {
        rule.actions.icon.shape = shape;
      }
    }),
  );
}

export function setMapIconEnabled(
  filter: Filter,
  rule: FilterRule,
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions.icon) {
        rule.actions.icon.enabled = enabled;
      }
    }),
  );
}

export function setColor(
  filter: Filter,
  rule: FilterRule,
  key: "text" | "background" | "border",
  color: { r: number; g: number; b: number; a: number },
) {
  filter.execute(
    new Command(() => {
      const existingColor = rule.actions[key];
      if (
        !existingColor ||
        existingColor.r !== color.r ||
        existingColor.g !== color.g ||
        existingColor.b !== color.b ||
        existingColor.a !== color.a
      ) {
        rule.actions[key] = { ...color, enabled: true };
      }
    }),
  );
}

/** Toggle a color's enabled flag without losing the stored RGBA values. */
export function setColorEnabled(
  filter: Filter,
  rule: FilterRule,
  key: "text" | "background" | "border",
  enabled: boolean,
) {
  filter.execute(
    new Command(() => {
      if (rule.actions[key]) {
        rule.actions[key].enabled = enabled;
      }
    }),
  );
}

export function moveRule(filter: Filter, sourceId: string, targetId: string) {
  filter.execute(
    new Command(() => {
      const itemIds = filter.rules.map((e) => e.id);
      const fromIndex = itemIds.indexOf(sourceId);
      const toIndex = itemIds.indexOf(targetId);
      if (fromIndex !== toIndex) {
        const updatedItems = filter.rules.slice();
        if (updatedItems) {
          updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
          filter.rules = updatedItems;
        }
      }
    }),
  );
}

export function createRule(filter: Filter, rule: FilterRule) {
  filter?.execute(
    new Command(() => {
      filter.rules.push(rule);
    }),
  );
}

export function duplicateRule(filter: Filter, rule: FilterRule) {
  filter?.execute(
    new Command(() => {
      const index = filter.rules.findIndex((r) => r.id === rule.id);
      if (index !== -1) {
        const duplicatedRule = clone(rule);
        duplicatedRule.id = ulid();
        duplicatedRule.conditions = convertRawToConditions(
          duplicatedRule.conditions,
        );
        filter.rules.splice(index + 1, 0, duplicatedRule);
      }
    }),
  );
}

export function deleteRule(filter: Filter, rule: FilterRule) {
  filter?.execute(
    new Command(() => {
      filter.rules = filter.rules.filter((entry) => entry.id !== rule.id);
    }),
  );
}

export function excuteCmd(filter: Filter, fn: (...rest: unknown[]) => unknown) {
  filter.execute(
    new Command(() => {
      fn();
    }),
  );
}

export function setEntryActive(
  filter: Filter,
  entry: FilterRule | FilterItem,
  state: boolean,
) {
  filter?.execute(
    new Command(() => {
      entry.enabled = state;
      if ("conditions" in entry) {
        for (const base of entry.bases) {
          base.enabled = state;
        }
      }
      if ("category" in entry && entry.parent) {
        entry.parent.enabled = entry.parent.bases.some((base) => base.enabled);
      }
    }),
  );
}

export function createUniqueCollectionRule(
  filter: Filter,
  league: string,
): UniqueCollectionRule {
  const rule: UniqueCollectionRule = {
    type: "unique-collection",
    id: ulid(),
    name: "Missing Uniques",
    show: true,
    enabled: true,
    bases: [],
    conditions: [],
    actions: {},
    continue: false,
    uniqueCollection: {
      league,
      display: "league",
      selectedLeagues: [],
    },
  };
  filter.execute(
    new Command(() => {
      filter.rules.push(rule);
    }),
  );
  return rule;
}

export function deriveBasesFromCache(
  uniques: PoeladderUnique[],
  selectedLeagues: string[],
): FilterItem[] {
  if (selectedLeagues.length === 0) return [];
  const leagueSet = new Set(selectedLeagues);
  return uniques
    .filter((u) => leagueSet.has(u.league))
    .map((u) => ({
      name: u.name,
      enabled: true,
      base: u.base,
      category: u.grouping,
      league: u.league,
    }));
}

export function refreshUniqueCollectionBases(
  filter: Filter,
  uniques: PoeladderUnique[],
) {
  filter.execute(
    new Command(() => {
      const now = new Date().toISOString();
      for (const rule of filter.rules) {
        if (rule.type !== "unique-collection") continue;
        rule.bases = deriveBasesFromCache(
          uniques,
          rule.uniqueCollection.selectedLeagues,
        );
        rule.uniqueCollection.lastRefreshed = now;
      }
    }),
  );
}

export function setUniqueCollectionLeague(
  filter: Filter,
  rule: UniqueCollectionRule,
  league: string,
) {
  filter.execute(
    new Command(() => {
      rule.uniqueCollection.league = league;
    }),
  );
}

export function setUniqueCollectionDisplay(
  filter: Filter,
  rule: UniqueCollectionRule,
  display: UniqueCollectionDisplay,
) {
  filter.execute(
    new Command(() => {
      rule.uniqueCollection.display = display;
    }),
  );
}

export function setUniqueCollectionSelectedLeagues(
  filter: Filter,
  rule: UniqueCollectionRule,
  selectedLeagues: string[],
  allUniques: PoeladderUnique[],
) {
  filter.execute(
    new Command(() => {
      rule.uniqueCollection.selectedLeagues = selectedLeagues;
      rule.bases = deriveBasesFromCache(allUniques, selectedLeagues);
    }),
  );
}

// helpers
export function addParentRefs(rules: FilterRule[]) {
  for (const rule of rules) {
    for (const base of rule.bases) {
      base.parent = rule;
    }
  }
}
