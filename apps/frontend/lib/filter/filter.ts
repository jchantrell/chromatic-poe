import { clone, stringifyJSON } from "@pkgs/lib/utils";
import data from "@pkgs/data/raw.json";
import chromatic from "@app/lib/config";
import { addFilter } from "@app/store";
import { ulid } from "ulid";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import {
  type FilterRule,
  type FilterItem,
  type Command,
  actions,
  conditions,
  addParentRefs,
  Operator,
} from ".";
import { FilterCategory } from "./category";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";
import { createEffect } from "solid-js";

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

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

export type FilterEntryTypes = "root" | "category" | "rule" | "item";

export interface FilterHierarchy {
  id: ReturnType<typeof ulid>;
  name: string | null;
  type: FilterEntryTypes;
  icon?: string | null;
  value?: number | null;
}

export class Filter {
  name: string;
  version: number;
  lastUpdated: Date;
  rules: FilterRoot;

  undoStack: Operation[][] = [];
  redoStack: Operation[][] = [];

  observer: undefined;

  constructor(params: {
    name: string;
    version: number;
    lastUpdated: Date;
    rules: FilterRoot;
    undoStack?: Operation[][];
    redoStack?: Operation[][];
  }) {
    this.name = params.name;
    this.version = params.version;
    this.lastUpdated = params.lastUpdated;
    this.rules = params.rules;

    if (params.undoStack) this.undoStack = params.undoStack;
    if (params.redoStack) this.redoStack = params.redoStack;

    addFilter(this);
    addParentRefs(this.rules);
    createMutable(this);
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
    return new Filter(clone(this));
  }

  execute(command: Command) {
    const originalState = clone(this.rules);
    command.execute();
    const changes = this.diff(originalState, clone(this.rules));
    if (changes.length) {
      this.undoStack.push(changes);
      this.redoStack = [];
    }
  }

  diff(currentState: FilterRoot, updatedState: FilterRoot) {
    return compare(updatedState, currentState).filter(
      (change) =>
        !change.path.endsWith("isDndShadowItem") &&
        !change.path.endsWith("parent"),
    );
  }

  undo(): void {
    if (!this.undoStack.length) {
      return;
    }
    const changes = this.undoStack.pop();
    if (changes) {
      const updatedState = this.applyChanges(changes);
      const diff = this.diff(clone(this.rules), updatedState);
      modifyMutable(this.rules, reconcile(updatedState));
      addParentRefs(this.rules); // FIX: this is wasteful
      if (diff.length) {
        this.redoStack.unshift(diff);
      }
    }
  }

  redo(): void {
    if (!this.redoStack.length) {
      return;
    }
    const changes = this.redoStack.shift();
    if (changes) {
      const updatedState = this.applyChanges(changes);
      const diff = this.diff(clone(this.rules), updatedState);
      modifyMutable(this.rules, reconcile(updatedState));
      addParentRefs(this.rules); // FIX: this is wasteful
      if (diff.length) {
        this.undoStack.push(diff);
      }
    }
  }

  private applyChanges(changes: Operation[]) {
    const copy = clone(this.rules);
    applyPatch(copy, changes);
    return copy;
  }

  async deleteFile() {
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.deleteFile(path);
    await chromatic.fileSystem.deleteFile(
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile/${this.name}.filter`,
    );
  }

  async writeFile() {
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.writeFile(
      path,
      stringifyJSON({ ...this, lastUpdated: new Date().toISOString() }),
    );
    await chromatic.fileSystem.writeFile(
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile/${this.name}.filter`,
      this.serialize(),
    );
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
        const block = this.createTextBlock(
          description,
          Block.hide,
          [conditions.baseType(Operator.eq, disabledBases)],
          [],
        );
        rules.push(block);
      }

      if (enabledBases.length) {
        const block = this.createTextBlock(
          description,
          Block.show,
          [conditions.baseType(Operator.eq, enabledBases)],
          [
            actions.setBackgroundColor(100, 100, 50, 255),
            actions.setFontSize(30),
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

export class FilterRoot implements FilterHierarchy {
  id: string;
  name = null;
  type = "root" as const;
  children: FilterCategory[];

  constructor(props: {
    id: string;
    children: FilterCategory[];
  }) {
    this.id = props.id;
    this.children = props.children.map(
      (category) => new FilterCategory(category),
    );
    createMutable(this);
  }
}

export function getIcon(entry: ItemHierarchy): string | null {
  if (entry.type === "item") return entry.icon;
  if (!entry.children.length) return null;
  return getIcon(entry.children[0]);
}

function rollup<T extends ItemHierarchy>(rawData: RawData, ancestor: T) {
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
          type: "category",
          enabled: true,
          children: [],
        };
        break;
      case "rule":
        record = {
          id: ulid(),
          name,
          type: "rule",
          enabled: true,
          children: [],
        };
        break;
      case "item":
        record = {
          id: ulid(),
          type: "item",
          name,
          enabled: true,
          icon: `images/${data.file.replaceAll("/", "@").replace("dds", "png")}`,
          value:
            data.value && typeof data.value === "number" ? data.value : null,
        };
        break;
    }

    if (ancestor.type !== "item") {
      ancestor.children.push(record);
      ancestor.children = ancestor.children
        .slice()
        .sort((a, b) => (b.value || 0) - (a?.value || 0));
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
  object: Record<string, unknown>,
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
    schema = sameKey ? schema : schema[entry];
  }
  schema[path[path.length - 1] as string] = { ...value, type: "item" };
}

export async function generateFilter(
  name: string,
  poeVersion: number,
): Promise<Filter> {
  if (poeVersion !== 1) {
    throw new Error("Only PoE 1 is currently supported");
  }
  const hierarchy = {};
  for (const entry of data) {
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

  const raw = rollup(
    { ...hierarchy },
    {
      id: ulid(),
      icon: null,
      name: null,
      type: "root",
      children: [],
    },
  );

  return new Filter({
    name,
    version: 1,
    lastUpdated: new Date(),
    rules: raw,
  });
}
