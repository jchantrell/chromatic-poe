import { clone, stringifyJSON } from "@pkgs/lib/utils";
import data from "@pkgs/data/poe2/items.json";
import chromatic from "@app/lib/config";
import { addFilter } from "@app/store";
import { ulid } from "ulid";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import {
  type Command,
  type Action,
  serializeActions,
  conditions,
  addParentRefs,
  Operator,
} from ".";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";

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

export type ItemHierarchy = FilterRoot | FilterRule | FilterItem;

export type FilterEntryTypes = "root" | "rule" | "item";

export interface FilterHierarchy {
  id: ReturnType<typeof ulid>;
  name: string | null;
  type: FilterEntryTypes;
  icon?: string | null;
  value?: number | null;
}

export interface FilterRoot extends FilterHierarchy {
  id: string;
  name: null;
  type: "root";
  children: FilterRule[];
}

export interface FilterRule extends FilterHierarchy {
  id: string;
  name: string;
  type: "rule";
  icon: string | null;
  enabled: boolean;
  conditions: { [key: string]: string[] }[];
  actions: Action;
  children: (FilterRule | FilterItem)[];
  parent?: FilterRoot | FilterRule;
}

export interface FilterItem extends FilterHierarchy {
  id: string;
  name: string;
  type: "item";
  icon: string;
  value: number | null;
  enabled: boolean;
  parent?: FilterRule;
}

export class Filter {
  name: string;
  version: number;
  lastUpdated: Date;
  rules: FilterRoot;

  undoStack: Operation[][] = [];
  redoStack: Operation[][] = [];

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
    const currState = clone(this.rules);
    command.execute(); // currState is mutated
    const changes = this.diff(currState, this.rules);
    if (changes.length) {
      this.undoStack.push(changes);
      this.redoStack = [];
    }
  }

  diff(prevState: FilterRoot, nextState: FilterRoot) {
    return compare(nextState, prevState).filter(
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
        const block = this.createTextBlock(description, Block.hide, entry, [
          conditions.baseType(Operator.eq, disabledBases),
        ]);
        rules.push(block);
      }

      if (enabledBases.length) {
        const block = this.createTextBlock(description, Block.show, entry, [
          conditions.baseType(Operator.eq, enabledBases),
        ]);
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
    entry: FilterRule,
    conditions: string[],
  ) {
    const eol = chromatic.fileSystem.eol();

    const txt = `${description}${eol}${block}${eol}${conditions.map((condition) => `   ${condition}${eol}`).join("")}${serializeActions(
      entry.actions,
    )
      .map((action) => `  ${action}${eol}`)
      .join("")}
`;
    return txt;
  }
}

export function getIcon(entry: ItemHierarchy): string | null {
  if (entry.type === "item") return entry.icon;
  if (!entry.children.length) return null;
  return getIcon(entry.children[0]);
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
      schema[entry] = { type: "rule" };
    }
    schema = sameKey ? schema : schema[entry];
  }
  schema[path[path.length - 1] as string] = { ...value, type: "item" };
}

function getPrimaryCategory(entry: RawData) {
  const { major_category, sub_category } = entry;

  if (["One Handed", "Two Handed", "Quivers"].includes(major_category)) {
    return "Weapons";
  }

  if (
    major_category === sub_category ||
    major_category === sub_category.substring(0, sub_category.length - 1)
  ) {
    return sub_category;
  }

  return major_category;
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
      case "rule":
        record = {
          id: ulid(),
          name,
          type: "rule",
          conditions: [],
          actions: ancestor.actions
            ? clone(ancestor.actions)
            : {
                text: { r: 255, g: 255, b: 255, a: 1 },
                border: { r: 255, g: 255, b: 255, a: 1 },
                background: {
                  r: Math.random() * 255,
                  g: Math.random() * 255,
                  b: Math.random() * 255,
                  a: 1,
                },
              },
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
          icon: `poe2/images/${data.file.replaceAll("/", "@").replace("dds", "png")}`,
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
    const primaryCategory = getPrimaryCategory(entry);

    const typeFirst = [primaryCategory, type, sub_category, base];
    const statFirst = [primaryCategory, sub_category, type, base];
    const weaponOverride = [
      primaryCategory,
      major_category,
      sub_category,
      base,
    ];

    recursivelySetKeys(
      hierarchy,
      primaryCategory === "Weapons"
        ? weaponOverride
        : major_category === "Gems"
          ? statFirst
          : typeFirst,
      {
        pool,
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

  return new Filter({
    name,
    version: 2,
    lastUpdated: new Date(),
    rules: rollup(
      { ...hierarchy },
      {
        id: ulid(),
        icon: null,
        name: null,
        type: "root",
        children: [],
      },
    ),
  });
}
