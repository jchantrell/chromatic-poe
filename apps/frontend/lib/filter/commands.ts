import type {
  FilterRule,
  FilterItem,
  Filter,
  Color,
  IconSize,
  Shape,
} from "@app/lib/filter";
import type { RgbColor } from "@pkgs/ui/color-picker";
import { batch } from "solid-js";

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
  rgb: RgbColor,
) {
  filter.execute(
    new Command(() => {
      rule.actions[key] = rgb;
    }),
  );
}

export function moveItem(
  filter: Filter,
  index: number,
  item: { data: FilterItem; id: string },
  source: FilterRule,
  target: FilterRule,
) {
  filter?.execute(
    new Command(() => {
      batch(() => {
        source.bases = source.bases.filter((entry) => item.id !== entry.id);
        target.bases = [
          ...target.bases.slice(0, index),
          { ...item.data, parent: target },
          ...target.bases.slice(index),
        ];
      });
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

export function deleteRule(filter: Filter, rule: FilterRule) {
  filter?.execute(
    new Command(() => {
      filter.rules = filter.rules.filter((entry) => entry.id !== rule.id);
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
      if (entry.type === "rule") {
        for (const base of entry.bases) {
          base.enabled = state;
        }
      }
      if (entry.type === "item" && entry.parent) {
        setEntryActive(filter, entry.parent, state);
      }
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
