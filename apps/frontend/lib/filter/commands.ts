import type {
  ItemHierarchy,
  FilterCategory,
  FilterRule,
  FilterItem,
} from "@app/lib/filter";

export class Command {
  execute: (...args: unknown[]) => unknown;
  constructor(execute: (...args: unknown[]) => unknown) {
    this.execute = execute;
  }
}

export function addParentRefs(entry: ItemHierarchy): ItemHierarchy {
  if (entry.type === "item") return entry;
  for (const child of entry.children) {
    child.parent = entry;
    if (child.type !== "item") addParentRefs(child);
  }
  return entry;
}

export function setEntryActive(
  entry: FilterCategory | FilterRule | FilterItem,
  state: boolean,
) {
  return new Command(() => {
    entry.enabled = state;
    if (entry.type !== "item") {
      setChildrenActive(entry.children, state);
    }
    if (entry.parent && entry.parent.type !== "root") {
      setParentActive(entry.parent);
    }
  });
}

function setChildrenActive(
  children: (FilterCategory | FilterRule | FilterItem)[],
  state: boolean,
) {
  for (const child of children) {
    child.enabled = state;
    if (child.type === "category" || child.type === "rule") {
      setChildrenActive(child.children, state);
    }
  }
}

function setParentActive(parent: FilterCategory | FilterRule) {
  parent.enabled = parent?.children.some((e) => e.enabled);
  if (parent.parent && parent.parent.type !== "root") {
    setParentActive(parent.parent);
  }
}
