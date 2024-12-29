import { clone, stringifyJSON } from "@pkgs/lib/utils";
import chromatic from "@app/lib/config";
import { addFilter } from "@app/store";
import type { ulid } from "ulid";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import {
  type Command,
  type Actions,
  type Conditions,
  serializeActions,
  addParentRefs,
  Operator,
  serializeConditions,
} from ".";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export interface FilterRule {
  id: ReturnType<typeof ulid>;
  name: string;
  icon: string | null;
  show: boolean;
  enabled: boolean;
  conditions: Conditions;
  actions: Actions;
  bases: FilterItem[];
}

export interface FilterItem {
  name: string;
  art: string;
  enabled: boolean;
  parent?: FilterRule;
  category: string;
  class: string;
  type: string;
  score: number;
  height: number;
  width: number;
  strReq: number;
  dexReq: number;
  intReq: number;
  itemClass: string;
  corruptable: boolean;
  mirrorable: boolean;
  stackable: boolean;
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
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile 2/${this.name}.filter`,
    );
  }

  async writeFile() {
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.writeFile(
      path,
      stringifyJSON({ ...this, lastUpdated: new Date().toISOString() }),
    );
    await chromatic.fileSystem.writeFile(
      `/mnt/c/Users/Joel/Documents/My Games/Path of Exile 2/${this.name}.filter`,
      this.serialize(),
    );
  }

  serialize(): string {
    let text = "";
    for (const rule of this.rules) {
      if (rule.enabled) {
        text += this.convertToText(rule);
      }
    }
    return text;
  }

  convertToText(rule: FilterRule): string {
    const enabledBases = rule.bases.filter((e) => e.enabled).map((e) => e.name);
    const block = this.createTextBlock(rule.name, rule.show, rule.actions, {
      ...rule.conditions,
      bases: enabledBases,
    });

    return block;
  }

  createTextBlock(
    description: string,
    show: boolean,
    actions: Actions,
    conditions: Conditions,
  ) {
    const eol = chromatic.fileSystem.eol();

    const txt = `# ${description}${eol}${show ? Block.show : Block.hide}${eol}${serializeConditions(
      conditions,
    ).map((condition) => `  ${condition}${eol}`)}${serializeActions(actions)
      .map((action) => `  ${action}${eol}`)
      .join("")}
`;
    return txt;
  }
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
