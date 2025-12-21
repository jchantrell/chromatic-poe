import {
  BaseTypeCondition,
  type Conditions,
  convertRawToConditions,
  serializeConditions,
} from "@app/lib/condition";
import chromatic from "@app/lib/config";
import { clone } from "@app/lib/utils";
import { addFilter } from "@app/store";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";
import { toast } from "solid-sonner";
import type { ulid } from "ulid";
import { type Actions, serializeActions } from "./action";
import { addParentRefs, type Command } from "./commands";
import { importFilter } from "./import";

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
    poePatch: string;
    lastUpdated: Date;
    rules: FilterRule[];
    undoStack?: Operation[][];
    redoStack?: Operation[][];
  }) {
    this.name = params.name;
    this.chromaticVersion = params.chromaticVersion;
    this.poeVersion = params.poeVersion;
    this.poePatch = params.poePatch;
    this.lastUpdated = params.lastUpdated;
    this.rules = params.rules.map((rule) => ({
      ...rule,
      conditions: convertRawToConditions(rule.conditions),
    }));

    if (params.undoStack) this.undoStack = params.undoStack;
    if (params.redoStack) this.redoStack = params.redoStack;

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
    await chromatic.renameFilter(this, newName);
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
      for (let i = 0; i < updatedState.length; i++) {
        updatedState[i] = {
          ...updatedState[i],
          conditions: convertRawToConditions(updatedState[i].conditions),
        };
      }
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
    await chromatic.deleteFilter(this);
    toast("Deleted filter.");
  }

  async save() {
    this.setLastUpdated(new Date());
    await chromatic.saveFilter(this);
  }

  async writeFile() {
    const now = Date.now();
    if (now - this.lastWriteTime < WRITE_TIMEOUT) {
      return;
    }
    this.lastWriteTime = now;
    await chromatic.writeFilter(this);
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

    const conditions = [...rule.conditions];
    if (enabledBases.length) {
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
    const eol = chromatic.eol();
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

export async function generateFilter(
  name: string,
  poeVersion: number,
  raw?: string,
): Promise<Filter> {
  let rules: FilterRule[] = [];

  if (raw) {
    rules = await importFilter(raw);
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
