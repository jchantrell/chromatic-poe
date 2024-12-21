import type {
  ItemHierarchy,
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
        source.children = source.children.filter(
          (entry) => item.id !== entry.id,
        );
        target.children = [
          ...target.children.slice(0, index),
          { ...item.data, parent: target },
          ...target.children.slice(index),
        ];
      });
    }),
  );
}

export function createRule(
  filter: Filter,
  rule: FilterRule,
  parentRef: FilterRule[],
) {
  filter?.execute(
    new Command(() => {
      parentRef.push(rule);
    }),
  );
}

export function deleteRule(filter: Filter, rule: FilterRule) {
  filter?.execute(
    new Command(() => {
      if (rule.parent) {
        rule.parent.children = rule.parent?.children.filter(
          (entry) => entry.id !== rule.id,
        );
      }
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
      if (entry.type !== "item") {
        setChildrenActive(entry.children, state);
      }
      if (entry.parent && entry.parent.type !== "root") {
        setParentActive(entry.parent);
      }
    }),
  );
}

// helpers
function setChildrenActive(
  children: (FilterRule | FilterItem)[],
  state: boolean,
) {
  for (const child of children) {
    child.enabled = state;
    if (child.type === "rule") {
      setChildrenActive(child.children, state);
    }
  }
}
function setParentActive(parent: FilterRule) {
  parent.enabled = parent?.children.some((e) => e.enabled);
  if (parent.parent && parent.parent.type !== "root") {
    setParentActive(parent.parent);
  }
}
export function addParentRefs(entries: ItemHierarchy[]) {
  for (const entry of entries) {
    addParentRef(entry);
  }
}

function addParentRef(entry: ItemHierarchy) {
  if (entry.type === "item") return entry;
  for (const child of entry.children) {
    child.parent = entry;
    if (child.type !== "item") addParentRef(child);
  }
  return entry;
}
