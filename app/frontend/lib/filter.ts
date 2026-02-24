import {
  BaseTypeCondition,
  type Conditions,
  Rarity,
  RarityCondition,
  convertRawToConditions,
  serializeConditions,
} from "@app/lib/condition";
import chromatic from "@app/lib/config";
import { clone, to } from "@app/lib/utils";
import { store } from "@app/store";
import { applyPatch, compare, type Operation } from "fast-json-patch";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";
import { toast } from "solid-sonner";
import type { ulid } from "ulid";
import { type Actions, serializeActions } from "./action";
import { addParentRefs, type Command } from "./commands";
import { dat } from "./dat";
import { importFilter } from "./import";
import { itemIndex } from "./items";

const WRITE_TIMEOUT = 1000;
const AUTOSAVE_DELAY = 2000;

export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export type RuleType = "standard" | "unique-collection";

/** Whether to show uniques missing in the selected league only, or combined with standard. */
export type UniqueCollectionDisplay = "league" | "combined";

/** Metadata for a unique-collection rule that auto-generates conditions from poeladder API. */
export interface UniqueCollectionConfig {
  league: string;
  display: UniqueCollectionDisplay;
  lastRefreshed?: string;
}

interface BaseFilterRule {
  id: ReturnType<typeof ulid>;
  name: string;
  show: boolean;
  enabled: boolean;
  conditions: Conditions[];
  actions: Actions;
  bases: FilterItem[];
  continue: boolean;
}

export interface StandardRule extends BaseFilterRule {
  type: "standard";
}

export interface UniqueCollectionRule extends BaseFilterRule {
  type: "unique-collection";
  uniqueCollection: UniqueCollectionConfig;
}

export type FilterRule = StandardRule | UniqueCollectionRule;

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
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;

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
        type: rule.type ?? "standard",
        conditions: convertRawToConditions(rule.conditions),
      };
      // Migrate unique-collection rules missing the display field
      if (
        migrated.type === "unique-collection" &&
        "uniqueCollection" in migrated &&
        !(migrated as UniqueCollectionRule).uniqueCollection.display
      ) {
        (migrated as UniqueCollectionRule).uniqueCollection.display = "league";
      }
      return migrated;
    }) as FilterRule[];

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
      this.scheduleAutosave();
    }
  }

  /**
   * Debounced auto-save: resets on each call, only fires after AUTOSAVE_DELAY ms
   * of inactivity. Saves to IDB and writes to the game's filter directory silently.
   */
  private scheduleAutosave() {
    if (!store.autosave) return;

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(async () => {
      this.autosaveTimer = null;
      this.setLastUpdated(new Date());
      await chromatic.saveFilter(this, true);
      if (chromatic.runtime === "desktop") {
        await chromatic.writeFilter(this, true);
      }
    }, AUTOSAVE_DELAY);
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
    const conditions = [...rule.conditions];

    if (rule.type === "unique-collection") {
      // Auto-generate Rarity == Unique
      conditions.push(new RarityCondition({ value: [Rarity.UNIQUE] }));

      // Auto-generate BaseType from all bases
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
      await dat.ensureDbInitialized();
      const [extractErr] = await to(dat.extract(patch));
      if (extractErr) {
        console.error("Failed to extract game data for import", extractErr);
      }
      const [loadErr, data] = await to(dat.load(patch));
      if (loadErr || !data) {
        console.error("Failed to load game data for import", loadErr);
      } else {
        if (poeVersion === 1) {
          itemIndex.initV1(data.items as Item[], patch);
        } else {
          itemIndex.initV2(data.items as Item[], patch);
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
