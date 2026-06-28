import {
  BaseTypeCondition,
  ConditionKey,
  type Conditions,
  convertRawToConditions,
  MissingUniquesCondition,
  Rarity,
  RarityCondition,
  serializeConditions,
} from "@app/lib/condition";
import chromatic from "@app/lib/config";
import { clone, to } from "@app/lib/utils";
import { store } from "@app/store";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import {
  createMutable,
  modifyMutable,
  reconcile,
  unwrap,
} from "solid-js/store";
import { toast } from "solid-sonner";
import type { ulid } from "ulid";
import { type Actions, serializeActions } from "./action";
import { addParentRefs, type Command } from "./commands";
import { dat } from "./dat";
import { fetchDataRelease } from "./data-release";
import { importFilter } from "./import";
import { itemIndex } from "./items";

const WRITE_TIMEOUT = 1000;
const AUTOSAVE_DELAY = 2000;
const MAX_UNDO_STACK = 100;

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export type UniqueCollectionDisplay = "league" | "combined";

export interface FilterRule {
  id: ReturnType<typeof ulid>;
  name: string;
  type: string;
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
  league?: string;
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
  dropLevel: number;
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

  dirty = false;

  private lastWriteTime = 0;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private batchSnapshot: FilterRule[] | null = null;

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
    this.rules = params.rules.map((rule) => {
      const migrated = {
        ...rule,
        type: "standard",
        conditions: convertRawToConditions(rule.conditions),
      };
      if (rule.type === "unique-collection" && "uniqueCollection" in rule) {
        const uc = (rule as any).uniqueCollection;
        const categories = uc.selectedCategories ?? uc.selectedLeagues ?? [];
        migrated.conditions.push(
          new MissingUniquesCondition({
            value: categories,
            leagueSlug: uc.league ?? "",
            display: uc.display ?? "league",
          }),
        );
        delete (migrated as any).uniqueCollection;
      }
      return migrated;
    }) as FilterRule[];

    if (params.undoStack)
      this.undoStack = params.undoStack.slice(-MAX_UNDO_STACK);
    if (params.redoStack)
      this.redoStack = params.redoStack.slice(0, MAX_UNDO_STACK);

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
    const currState = clone(unwrap(this.rules));
    command.execute();
    const changes = this.diff(currState, unwrap(this.rules));
    if (changes.length) {
      this.pushUndo(changes);
      this.redoStack = [];
      this.scheduleAutosave();
    }
  }

  /**
   * Starts a batch of direct rule mutations (e.g. a slider drag or color
   * picker drag). Snapshots state once so high-frequency events skip the
   * per-event clone/diff that execute() performs. Idempotent while a batch
   * is open; call commitBatch() when the interaction ends.
   */
  beginBatch() {
    this.dirty = true;
    if (!this.batchSnapshot) {
      this.batchSnapshot = clone(unwrap(this.rules));
    }
  }

  /** Commits an open batch as a single undo entry and schedules an autosave. */
  commitBatch() {
    if (!this.batchSnapshot) return;
    const changes = this.diff(this.batchSnapshot, unwrap(this.rules));
    this.batchSnapshot = null;
    if (changes.length) {
      this.pushUndo(changes);
      this.redoStack = [];
      this.scheduleAutosave();
    }
  }

  private pushUndo(changes: Operation[]) {
    this.undoStack.push(changes);
    if (this.undoStack.length > MAX_UNDO_STACK) {
      this.undoStack.shift();
    }
  }

  scheduleAutosave() {
    this.dirty = true;
    if (!store.autosave) return;

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null;
      this.performAutosave();
    }, AUTOSAVE_DELAY);
  }

  private async performAutosave() {
    try {
      this.setLastUpdated(new Date());
      await chromatic.saveFilter(this, true);
      if (chromatic.runtime === "desktop") {
        await chromatic.writeFilter(this, true);
      }
      this.dirty = false;
    } catch (err) {
      console.error("Autosave failed", err);
    }
  }

  /**
   * Immediately executes any pending autosave. Call on window close / beforeunload
   * to prevent data loss from the debounce window.
   */
  async flushAutosave() {
    this.commitBatch();
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
      await this.performAutosave();
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
      const diff = this.diff(clone(unwrap(this.rules)), updatedState);
      modifyMutable(this.rules, reconcile(updatedState));

      if (diff.length) {
        this.redoStack.unshift(diff);
        this.scheduleAutosave();
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
      const diff = this.diff(clone(unwrap(this.rules)), updatedState);
      modifyMutable(this.rules, reconcile(updatedState));
      addParentRefs(this.rules); // FIX: this is wasteful
      if (diff.length) {
        this.pushUndo(diff);
        this.scheduleAutosave();
      }
    }
  }

  private applyChanges(changes: Operation[]) {
    const copy = clone(unwrap(this.rules));
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
    this.dirty = false;
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
    const conditions = [...rule.conditions].filter(
      (c) =>
        c.key !== ConditionKey.UNIQUE_TIERS &&
        c.key !== ConditionKey.MISSING_UNIQUES,
    );

    const hasUniqueCond = rule.conditions.some(
      (c) =>
        c.key === ConditionKey.UNIQUE_TIERS ||
        c.key === ConditionKey.MISSING_UNIQUES,
    );

    if (hasUniqueCond) {
      conditions.push(new RarityCondition({ value: [Rarity.UNIQUE] }));
      const baseTypes = rule.bases.map((e) => e.base);
      if (baseTypes.length) {
        conditions.push(
          new BaseTypeCondition({
            value: Array.from(new Set(baseTypes)),
          }),
        );
      }
    } else {
      const enabledBases = rule.bases
        .filter((e) => e.enabled)
        .map((e) => e.base);
      if (enabledBases.length) {
        conditions.push(
          new BaseTypeCondition({
            value: Array.from(new Set(enabledBases)),
          }),
        );
      }
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
      .filter((condition) => condition !== "")
      .map((condition) => `  ${condition}${eol}`)
      .join("");
    const actionText = serializeActions(actions)
      .filter((action) => action !== "")
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
  const patch =
    poeVersion === 2
      ? (store.poeCurrentVersions?.poe2 ?? "4.0.0")
      : (store.poeCurrentVersions?.poe1 ?? "3.25");

  let rules: FilterRule[] = [];

  if (raw) {
    // Ensure itemIndex is populated before import so BaseType resolution works.
    // itemIndex is normally initialised in the editor, but import runs on the
    // load screen before the editor mounts.
    if (!itemIndex.searchIndex || itemIndex.patch !== patch) {
      const [err, data] = await to(fetchDataRelease(dat.idb, patch));
      if (err || !data) {
        console.error("Failed to load game data for import", err);
      } else {
        const allItems = [
          ...data.items,
          ...data.uniques.map((u) => ({
            name: u.name,
            enabled: true,
            base: u.base ?? "",
            category: u.category,
            class: u.class ?? "",
            type: u.type ?? "",
            score: u.score ?? 0,
            art: u.art ?? "",
            height: u.height ?? 0,
            width: u.width ?? 0,
            itemClass: u.itemClass ?? "",
            gemFx: u.gemFx,
          })),
        ] as Item[];
        if (poeVersion === 1) {
          itemIndex.initV1(allItems, patch);
        } else {
          itemIndex.initV2(allItems, patch);
        }
      }
    }

    rules = await importFilter(raw);
  }

  return new Filter({
    name,
    chromaticVersion: chromatic.config.version,
    poeVersion,
    poePatch: patch,
    lastUpdated: new Date(),
    rules,
  });
}
