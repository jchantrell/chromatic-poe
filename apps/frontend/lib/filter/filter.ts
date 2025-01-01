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
  serializeConditions,
} from ".";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { sep } from "@tauri-apps/api/path";
import { toast } from "solid-sonner";

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
  itemClass: string;
  itemBase: string;
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
    const configPath = chromatic.getFiltersPath(this);
    const filterPath = `${chromatic.config.poeDirectory}${sep()}${this.name}.filter`;
    await chromatic.fileSystem.deleteFile(configPath);
    await chromatic.fileSystem.deleteFile(filterPath);
    toast("Deleted filter.");
  }

  async save() {
    const path = chromatic.getFiltersPath(this);
    await chromatic.fileSystem.writeFile(
      path,
      stringifyJSON({ ...this, lastUpdated: new Date().toISOString() }),
    );
    toast("Saved filter");
  }

  async writeFile() {
    if (chromatic.fileSystem.runtime === "desktop") {
      const path = `${chromatic.config.poeDirectory}${sep()}${this.name}.filter`;
      await chromatic.fileSystem.writeFile(path, this.serialize());
      setTimeout(async () => {
        await invoke("reload_filter");
      }, 250);
      toast("Wrote filter to PoE directory.");
    }

    if (chromatic.fileSystem.runtime === "web") {
      const filename = `${this.name}.filter`;
      const blob = new Blob([this.serialize()], { type: "text" });
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
      } else {
        const elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
      }
      toast("Exported filter. Check your downloads folder.");
    }
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
    const enabledBases = rule.bases
      .filter((e) => e.enabled)
      .map((e) => e.itemBase);
    const conditions = { ...rule.conditions };
    if (enabledBases.length) {
      conditions.bases = enabledBases;
    }
    const block = this.createTextBlock(
      rule.name,
      rule.show,
      rule.actions,
      conditions,
    );

    return block;
  }

  createTextBlock(
    description: string,
    show: boolean,
    actions: Actions,
    conditions: Conditions,
  ) {
    const eol = chromatic.fileSystem.eol();
    const block = show ? Block.show : Block.hide;
    const conditionText = serializeConditions(conditions)
      .map((condition) => `  ${condition}${eol}`)
      .join("");
    const actionText = serializeActions(actions)
      .map((action) => `  ${action}${eol}`)
      .join("");

    return `# ${description}${eol}${block}${eol}${conditionText}${actionText}${eol}`;
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
