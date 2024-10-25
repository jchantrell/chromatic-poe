import { clone, stringifyJSON } from "@pkgs/lib/utils";
import diff, { type Difference } from "microdiff";
import data from "@pkgs/data/raw.json";
import { ActionBuilder } from "./action";
import { ConditionBuilder, Operator } from "./condition";
import chromatic from "./config";
import { makeAutoObservable } from "mobx";
import { store } from "@app/store";
import { ulid } from "ulid";

type PathElement = string | number;

type NestedObject =
  | null
  | undefined
  | string
  | number
  | Filter
  | FilterRoot
  | FilterCategory
  | FilterRule
  | FilterItem
  | Array<NestedObject>
  | { [key: string]: NestedObject };

type PathReference = {
  parent: Record<string, NestedObject> | Array<NestedObject>;
  key: string | number;
  exists: boolean;
};

type RawData = {
  pool: string;
  major_category: string;
  sub_category: string;
  base: string;
  file: string;
  value: number | null;
  str: number | null;
  dex: number | null;
  int: number | null;
  isVaalGem: number | null;
  armMin: number | null;
  armMax: number | null;
  evaMin: number | null;
  evaMax: number | null;
  esMin: number | null;
  esMax: number | null;
  wardMin: number | null;
  wardMax: number | null;
};

export type ItemHierarchy =
  | FilterRoot
  | FilterCategory
  | FilterRule
  | FilterItem;

type FilterEntryTypes = "root" | "category" | "rule" | "item";

export interface FilterHierarchy {
  id: ReturnType<typeof ulid>;
  name: string | null;
  type: FilterEntryTypes;
  icon?: string;
  value?: number | null;
}

export interface FilterRoot extends FilterHierarchy {
  name: null;
  type: "root";
  children: FilterCategory[];
}

export interface FilterCategory extends FilterHierarchy {
  name: string;
  type: "category";
  enabled: boolean;
  parent?: FilterRoot | FilterCategory;
  children: (FilterRule | FilterCategory)[];
}

export interface FilterRule extends FilterHierarchy {
  name: string;
  type: "rule";
  enabled: boolean;
  conditions?: { [key: string]: string[] }[];
  actions?: { [key: string]: string[] }[];
  parent?: FilterCategory;
  children: FilterItem[];
}

export interface FilterItem extends FilterHierarchy {
  name: string;
  type: "item";
  enabled: boolean;
  parent?: FilterRule;
  icon: string;
  value: number | null;
}

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export class BlockBuilder {
  create(
    description: string,
    block: Block,
    actions: string[],
    conditions: string[],
  ) {
    const eol = chromatic.fileSystem.eol();
    return `${description}${eol}${block}${eol}${actions.map((action) => `   ${action}${eol}`).join("")}${conditions.map((condition) => `   ${condition}${eol}`).join("")}
`;
  }
}

class Command {
  execute: (...args: unknown[]) => unknown;
  constructor(execute: (...args: unknown[]) => unknown) {
    this.execute = execute;
  }
}

export class Filter {
  name: string;
  version: number;
  lastUpdated: Date | string;
  rules: FilterRoot;

  undoStack: Difference[][] = [];
  redoStack: Difference[][] = [];

  action = new ActionBuilder();
  condition = new ConditionBuilder();
  block = new BlockBuilder();

  isWriting = false;

  constructor(params: {
    name: string;
    version: number;
    lastUpdated: Date;
    rules: FilterRoot;
    undoStack?: Difference[][];
    redoStack?: Difference[][];
  }) {
    this.name = params.name;
    this.version = params.version;
    this.lastUpdated = params.lastUpdated;
    this.rules = params.rules;

    if (params.undoStack) this.undoStack = params.undoStack;
    if (params.redoStack) this.redoStack = params.redoStack;

    makeAutoObservable(this);
    store.addFilter(this);
    this.addParentRefs();
  }

  setLastUpdated(date: Date) {
    this.lastUpdated = date;
  }

  async updateName(newName: string) {
    const oldPath = chromatic.getFiltersPath(this);
    const newPath = chromatic.getFiltersPath(this, newName);
    await chromatic.fileSystem.renameFile(oldPath, newPath);
    this.name = newName;
    await this.writeFile();
  }

  copy(): Filter {
    const copy = new Filter(clone(this));
    return copy;
  }

  execute(command: Command) {
    const copy = clone(this.rules);
    command.execute();
    this.undoStack.push(diff(copy, this.rules));
    this.redoStack = [];
  }

  undo(): number {
    if (!this.undoStack.length) {
      return 0;
    }
    const copy = clone(this.rules);
    const changes = this.undoStack.pop();
    if (changes) {
      this.applyChanges(changes);
      this.redoStack.unshift(diff(copy, this.rules));
      return changes.length;
    }
    return 0;
  }

  redo(): number {
    if (!this.redoStack.length) {
      return 0;
    }
    const copy = clone(this.rules);
    const changes = this.redoStack.shift();
    if (changes) {
      this.applyChanges(changes);
      this.undoStack.push(diff(copy, this.rules));
      return changes.length;
    }
    return 0;
  }

  private applyChanges(changes: Difference[]) {
    for (const change of changes) {
      switch (change.type) {
        case "CREATE":
          this.removeProperty(change.path);
          break;
        case "REMOVE":
          this.createProperty(change.path, change.oldValue);
          break;
        case "CHANGE":
          this.changeProperty(change.path, change.oldValue);
          break;
      }
    }
  }

  private removeProperty(path: PathElement[]) {
    const ref = getNestedReference(this.rules, path);
    delete ref.parent[ref.key];
  }

  private createProperty(path: PathElement[], value: unknown) {
    const ref = getNestedReference(this.rules, path);
    ref.parent[ref.key] = value;
  }

  private changeProperty(path: PathElement[], value: unknown) {
    const ref = getNestedReference(this.rules, path);
    ref.parent[ref.key] = value;
  }

  async deleteFile() {
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.deleteFile(path);
    await chromatic.fileSystem.deleteFile(
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile/${this.name}.filter`,
    );
  }

  async writeFile() {
    if (this.isWriting) {
      return;
    }
    this.isWriting = true;
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.writeFile(
      path,
      stringifyJSON({ ...this, lastUpdated: new Date().toISOString() }),
    );
    await chromatic.fileSystem.writeFile(
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile/${this.name}.filter`,
      this.serialize(),
    );
    this.isWriting = false;
  }

  addParentRefs(entry?: ItemHierarchy): ItemHierarchy {
    if (!entry) return this.addParentRefs(this.rules);
    if (entry.type === "item") return entry;
    for (const child of entry.children) {
      child.parent = entry;
      if (child.type !== "item") this.addParentRefs(child);
    }
    return entry;
  }

  serialize(): string {
    let text = "";
    for (const child of this.rules.children) {
      const rules = this.convertToText([], child);
      text += rules.join("");
    }
    return text;
  }

  convertToText(ancestors: (string | null)[], entry: ItemHierarchy): string[] {
    const rules: string[] = [];

    if (entry.type === "rule") {
      const enabledBases = entry.children
        .filter((e) => e.enabled)
        .map((e) => e.name);
      const disabledBases = entry.children
        .filter((e) => !e.enabled)
        .map((e) => e.name);
      const description = `# ${ancestors.join(" => ")} => ${entry.name.trim()}`;

      if (disabledBases.length) {
        const block = this.block.create(
          description,
          Block.hide,
          [this.condition.baseType(Operator.eq, disabledBases)],
          [],
        );
        rules.push(block);
      }

      if (enabledBases.length) {
        const block = this.block.create(
          description,
          Block.show,
          [this.condition.baseType(Operator.eq, enabledBases)],
          [
            this.action.setBackgroundColor(100, 100, 50, 255),
            this.action.setFontSize(30),
          ],
        );
        rules.push(block);
      }

      return rules;
    }
    if (entry.type !== "item") {
      for (const child of entry.children) {
        rules.push(...this.convertToText([...ancestors, entry.name], child));
      }
    }

    return rules;
  }

  createTextBlock(
    description: string,
    block: Block,
    actions: string[],
    conditions: string[],
  ) {
    const eol = chromatic.fileSystem.eol();
    return `${description}${eol}${block}${eol}${actions.map((action) => `   ${action}${eol}`).join("")}${conditions.map((condition) => `   ${condition}${eol}`).join("")}
`;
  }
}

export function moveItem(
  item: FilterItem,
  sourceRule: FilterRule,
  targetRule: FilterRule,
  position: number,
) {
  return new Command(() => {
    console.log(sourceRule.children.length);
    sourceRule.children = sourceRule.children.filter(
      (child) => child.id !== item.id,
    );
    console.log(sourceRule.children.length);
    targetRule.children = [
      ...targetRule.children.slice(0, position),
      item,
      ...targetRule.children.slice(position),
    ];
  });
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

export function getIcon(entry: ItemHierarchy): string | null {
  if (entry.icon) return entry.icon;
  if (entry.type !== "item" && !entry.children.length) return null;
  if (entry.type === "item") return null;
  return getIcon(entry.children[0]);
}

function getNestedReference(
  obj: FilterRoot | Record<string, NestedObject>,
  path: PathElement[],
  createPath = false,
): PathReference {
  if (path.length === 0) {
    throw new Error("Path must contain at least one element");
  }

  let current: NestedObject = obj;
  let exists = true;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];

    if (
      typeof current === "object" &&
      !Array.isArray(current) &&
      current !== null
    ) {
      if (!(key in current)) {
        if (!createPath) {
          exists = false;
          break;
        }
        current[key] = typeof nextKey === "number" ? [] : {};
      }
      current = current[key];
    } else if (Array.isArray(current) && typeof key === "number") {
      if (key < 0 || key >= current.length) {
        exists = false;
        break;
      }
      current = current[key];
    } else {
      throw new Error(`Invalid path at segment ${i}: ${key}`);
    }
  }

  const lastKey = path[path.length - 1];

  if (current === null || current === undefined) {
    throw new Error("Parent reference is null or undefined");
  }

  if (typeof current === "object" && !Array.isArray(current)) {
    exists = exists && lastKey in current;
    return {
      parent: current as Record<string, NestedObject>,
      key: lastKey as string,
      exists,
    };
  }

  if (Array.isArray(current)) {
    if (typeof lastKey !== "number") {
      throw new Error("Cannot use string key with array parent");
    }
    exists = exists && lastKey >= 0 && lastKey < current.length;
    return {
      parent: current,
      key: lastKey,
      exists,
    };
  }

  throw new Error("Invalid path structure");
}

function rollup<T extends ItemHierarchy>(
  rawData: RawData | NestedObject,
  ancestor: T,
) {
  const entries = Object.entries(rawData);
  const children = entries.filter((entry) => entry[0] !== "type");

  for (const child of children) {
    const name = child[0];
    const data = child[1];
    const type: [string, FilterEntryTypes] = Object.entries(data).find(
      (entry) => entry[0] === "type",
    );

    let record: ItemHierarchy;

    switch (type[1]) {
      case "category":
        record = {
          id: ulid(),
          name,
          type: type[1],
          enabled: true,
          children: [],
        };
        break;
      case "rule":
        record = {
          id: ulid(),
          name,
          type: type[1],
          enabled: true,
          children: [],
        };
        break;
      case "item":
        record = {
          id: ulid(),
          name,
          type: type[1],
          enabled: true,
          icon: `images/${data.file.replaceAll("/", "@").replace("dds", "png")}`,
          value:
            data.value && typeof data.value === "number" ? data.value : null,
        };
        break;
    }

    if (ancestor.type !== "item") {
      ancestor.children.push(record);
      ancestor.children.sort((a, b) => (b.value || 0) - (a?.value || 0));
    }
    if (type[1] !== "item") rollup(child[1], record);
  }
  return ancestor;
}

function getType(entry: {
  isVaalGem: number | null;
  str: number | null;
  dex: number | null;
  int: number | null;
  armMax: number | null;
  evaMax: number | null;
  esMax: number | null;
  wardMax: number | null;
}): string | null {
  const { str, dex, int, armMax, evaMax, esMax, wardMax } = entry;

  if (str && dex && int) {
    return "Misc";
  }

  if (str || dex || int) {
    const normalisedStr = str ?? 0;
    const normalisedDex = dex ?? 0;
    const normalisedInt = int ?? 0;

    if (normalisedStr > normalisedDex && normalisedStr > normalisedInt) {
      return "Strength";
    }
    if (normalisedDex > normalisedStr && normalisedDex > normalisedInt) {
      return "Dexterity";
    }
    if (normalisedInt > normalisedStr && normalisedInt > normalisedDex) {
      return "Intelligence";
    }
  }

  if (armMax && evaMax && esMax) {
    return "Miscellaneous";
  }
  if (armMax && evaMax) {
    return "Strength / Dexterity";
  }
  if (armMax && esMax) {
    return "Strength / Intelligence";
  }
  if (evaMax && esMax) {
    return "Dexterity / Intelligence";
  }
  if (armMax) {
    return "Strength";
  }
  if (evaMax) {
    return "Dexterity";
  }
  if (esMax) {
    return "Intelligence";
  }
  if (wardMax) {
    return "Ward";
  }

  if (armMax === 0 && evaMax === 0 && esMax === 0 && wardMax === 0) {
    return "Miscellaneous";
  }

  return null;
}

function recursivelySetKeys(
  object: NestedObject<Partial<RawData>>,
  path: (string | null)[],
  value: Omit<RawData, "pool" | "major_category" | "sub_category" | "base">,
) {
  let schema = object;
  for (let i = 0; i < path.length - 1; i++) {
    const entry = path[i];
    if (!entry) {
      continue;
    }
    const sameKey = path[i - 1] && entry === path[i - 1];
    if (!schema[entry] && !sameKey) {
      if (i <= path.length - 3) {
        schema[entry] = { type: "category" };
      }
      if (i === path.length - 2) {
        schema[entry] = { type: "rule" };
      }
    }
    schema = sameKey
      ? schema
      : (schema[entry] as NestedObject<Partial<RawData>>);
  }
  schema[path[path.length - 1] as string] = { ...value, type: "item" };
}

function generateItems(rawData: RawData[]): FilterRoot {
  const hierarchy: NestedObject<RawData> = {};
  for (const entry of rawData) {
    const {
      pool,
      major_category,
      sub_category,
      base,
      file,
      value,
      str,
      dex,
      int,
      isVaalGem,
      armMin,
      armMax,
      evaMin,
      evaMax,
      esMin,
      esMax,
      wardMin,
      wardMax,
    } = entry;

    const type = getType(entry);

    const primaryCategory =
      major_category === sub_category ||
      major_category === sub_category.substring(0, sub_category.length - 1)
        ? sub_category
        : major_category;

    const typeFirst = [pool, primaryCategory, type, sub_category, base];
    const statFirst = [pool, primaryCategory, sub_category, type, base];

    recursivelySetKeys(
      hierarchy,
      ["Gems", "Off-hand"].includes(major_category) ? statFirst : typeFirst,
      {
        file,
        value,
        str,
        dex,
        int,
        isVaalGem,
        armMin,
        armMax,
        evaMin,
        evaMax,
        esMin,
        esMax,
        wardMin,
        wardMax,
      },
    );
  }

  return rollup(
    { ...hierarchy, type: "category" },
    {
      name: null,
      type: "root",
      children: [],
    },
  ) as FilterRoot;
}

export async function generate(
  name: string,
  poeVersion: number,
): Promise<Filter> {
  if (poeVersion !== 1) {
    throw new Error("Only PoE 1 is currently supported");
  }
  const rules = generateItems(data);
  console.log(rules);
  const filter = new Filter({
    name,
    version: 1,
    lastUpdated: new Date(),
    rules,
  });
  filter.addParentRefs();

  return filter;
}
