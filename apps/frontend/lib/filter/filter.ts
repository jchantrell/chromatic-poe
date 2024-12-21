import { clone, stringifyJSON } from "@pkgs/lib/utils";
import chromatic from "@app/lib/config";
import { addFilter } from "@app/store";
import type { ulid } from "ulid";
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
  rules: FilterRule[];

  undoStack: Operation[][] = [];
  redoStack: Operation[][] = [];

  constructor(params: {
    name: string;
    version: number;
    lastUpdated: Date;
    rules: FilterRule[];
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

  diff(prevState: FilterRule[], nextState: FilterRule[]) {
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
    for (const rule of this.rules) {
      const rules = this.convertToText([], rule);
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

export async function generateFilter(
  name: string,
  poeVersion: number,
): Promise<Filter> {
  return new Filter({
    name,
    version: poeVersion,
    lastUpdated: new Date(),
    rules: [],
  });
}
