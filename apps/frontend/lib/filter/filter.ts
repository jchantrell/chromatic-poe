import chromatic from "@app/lib/config";
import { clone, stringifyJSON } from "@app/lib/utils";
import { addFilter } from "@app/store";
import { invoke } from "@tauri-apps/api/core";
import { sep } from "@tauri-apps/api/path";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";
import { toast } from "solid-sonner";
import type { ulid } from "ulid";
import {
  addParentRefs,
  BaseTypeCondition,
  convertRawToConditions,
  importFilter as convertRules,
  itemIndex,
  serializeActions,
  serializeConditions,
  type Actions,
  type Command,
  type Conditions,
} from ".";

const WRITE_TIMEOUT = 1000;

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export interface FilterRule {
  id: ReturnType<typeof ulid>;
  name: string;
  show: boolean;
  enabled: boolean;
  conditions: Conditions[];
  actions: Actions;
  bases: FilterItem[];
  continue: boolean;
}

export interface FilterItem {
  name: string;
  enabled: boolean;
  base: string;
  category: string;
}

export interface Item extends FilterItem {
  itemClass: string;
  art: string;
  parent?: FilterRule;
  class: string;
  type: string;
  score: number;
  height: number;
  width: number;
}

export class Filter {
  name: string;
  chromaticVersion: string;
  poeVersion: number;
  poePatch: string;
  lastUpdated: Date;
  rules: FilterRule[];

  undoStack: Operation[][] = [];
  redoStack: Operation[][] = [];

  private lastWriteTime = 0;

  constructor(params: {
    name: string;
    chromaticVersion: string;
    poeVersion: number;
    poePatch?: string;
    lastUpdated: Date;
    rules: FilterRule[];
    undoStack?: Operation[][];
    redoStack?: Operation[][];
  }) {
    this.name = params.name;
    this.chromaticVersion = params.chromaticVersion;
    this.poeVersion = params.poeVersion;
    // Default patch if missing (migration)
    this.poePatch = params.poePatch || (params.poeVersion === 2 ? "4.0.0" : "3.25");
    this.lastUpdated = params.lastUpdated;
    this.rules = params.rules.map((rule) => ({
      ...rule,
      conditions: convertRawToConditions(rule.conditions),
    }));

    if (params.undoStack) this.undoStack = params.undoStack;
    if (params.redoStack) this.redoStack = params.redoStack;

    addFilter(this);
    addParentRefs(this.rules);
    createMutable(this);
  }

  setLastUpdated(date: Date) {
    this.lastUpdated = date;
  }

  setName(name: string) {
    this.name = name;
  }

  async updateName(newName: string) {
    const oldPath = chromatic.getFiltersPath(this);
    const newPath = chromatic.getFiltersPath(this, newName);
    await chromatic.fileSystem.renameFile(oldPath, newPath);
    this.setName(newName);
    await this.save();
  }

  copy(newName: string): Filter {
    const newFilter = clone(this);
    const filter = new Filter({
      ...newFilter,
      lastUpdated: new Date(),
      name: newName,
    });
    filter.save();
    return filter;
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
      (change) => !change.path.endsWith("parent"),
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
    await chromatic.fileSystem.deleteFile(configPath);
    if (chromatic.fileSystem.runtime === "desktop") {
      const filterPath = `${chromatic.config?.poeDirectory}${sep()}${this.name}.chromatic.filter`;
      if (await chromatic.fileSystem.exists(filterPath)) {
        await chromatic.fileSystem.deleteFile(filterPath);
      }
    }
    toast("Deleted filter.");
  }

  async save() {
    const path = chromatic.getFiltersPath(this);
    this.setLastUpdated(new Date());
    const filter = stringifyJSON({
      ...this,
      lastUpdated: this.lastUpdated.toISOString(),
    });
    await chromatic.fileSystem.writeFile(path, "text", filter);
  }

  async writeFile() {
    const now = Date.now();
    if (now - this.lastWriteTime < WRITE_TIMEOUT) {
      return;
    }
    this.lastWriteTime = now;

    if (chromatic.fileSystem.runtime === "desktop") {
      const path = `${chromatic.config.poeDirectory}${sep()}${this.name}.chromatic.filter`;
      await chromatic.fileSystem.writeFile(path, "text", this.serialize());
      setTimeout(async () => {
        await invoke("reload");
      }, 250);
      toast("Wrote filter to PoE directory.");
    }

    if (chromatic.fileSystem.runtime === "web") {
      const filename = `${this.name}.chromatic.filter`;
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
    const enabledBases = rule.bases.filter((e) => e.enabled).map((e) => e.base);

    console.log(rule.bases);

    // pinnacle key bases are not filterable
    const basesArePinnacleKeys = rule.bases.some(
      (e) =>
        itemIndex.itemTable[e.category][e.name].itemClass === "Pinnacle Keys",
    );

    const conditions = [...rule.conditions];
    if (enabledBases.length && !basesArePinnacleKeys) {
      conditions.push(
        new BaseTypeCondition({ value: Array.from(new Set(enabledBases)) }),
      );
    }

    return this.createTextBlock(
      rule.name,
      rule.show,
      rule.continue,
      rule.actions,
      conditions,
    );
  }

  createTextBlock(
    description: string,
    show: boolean,
    continueStmt: boolean,
    actions: Actions,
    conditions: Conditions[],
  ) {
    const eol = chromatic.fileSystem.eol();
    const block = show ? Block.show : Block.hide;
    const conditionText = serializeConditions(conditions)
      .map((condition) => `  ${condition}${eol}`)
      .join("");
    const actionText = serializeActions(actions)
      .map((action) => `  ${action}${eol}`)
      .join("");

    return `# ${description}${eol}${block}${eol}${conditionText}${actionText}${continueStmt ? "  Continue" : ""}${eol}`;
  }
}

export enum Template {
  BLANK = "Blank",
  MINIMAL = "Minimal",
}

export async function generateFilter(
  name: string,
  poeVersion: number,
  template: Template,
  raw?: string,
): Promise<Filter> {
  let rules: FilterRule[] = [];

  if (template === Template.MINIMAL) {
    return new Filter({
      name,
      chromaticVersion: chromatic.config.version,
      poeVersion,
      poePatch: poeVersion === 2 ? "4.0.0" : "3.25",
      lastUpdated: new Date(),
      rules
    });
  }

  if (raw) {
    rules = await convertRules(raw);
  }

  return new Filter({
    name,
    chromaticVersion: chromatic.config.version,
    poeVersion,
    poePatch: poeVersion === 2 ? "4.0.0" : "3.25",
    lastUpdated: new Date(),
    rules,
  });
}
