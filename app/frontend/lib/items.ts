import { recursivelySetKeys } from "@app/lib/utils";
import Fuse, { type FuseResult } from "fuse.js";
import type { FilterItem, Item } from "./filter";

type Hierarchy = { [key: string]: Item | Hierarchy };

class ItemIndex {
  searchIndex: Fuse<Item> | null = null;
  hierarchy: Hierarchy = {};
  classes: string[] = [];
  names: Set<string> = new Set();
  itemTable: { [key: string]: { [key: string]: Item } } = {};
  allItems: Item[] = [];
  patch!: string;

  findItemByBase(base: string) {
    return this.allItems.find(
      (item) => item.base && item.base.toLowerCase() === base.toLowerCase(),
    );
  }

  findItemByName(name: string) {
    return this.allItems.find((item) => item.name === name);
  }

  /**
   * Bases the loaded patch no longer knows about. Matched on name alone so an
   * item that merely moved category is not reported as removed. Returns nothing
   * while the index is empty, so a failed data load cannot flag every base.
   */
  findRemoved(bases: FilterItem[]): FilterItem[] {
    if (!this.names.size) return [];
    return bases.filter((base) => !this.names.has(base.name));
  }

  initV1(items: Item[], patch: string) {
    this.patch = patch;
    this.allItems = items;
    const options = {
      keys: ["name", "base", "category", "class", "type"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };

    const itemTable: { [key: string]: { [key: string]: Item } } = {};
    const classes = new Set<string>();
    const names = new Set<string>();

    for (const item of items) {
      // lookup table
      if (!itemTable[item.category]) {
        itemTable[item.category] = {};
      }
      itemTable[item.category][item.name] = item;

      names.add(item.name);

      // classes
      if (item.itemClass && item.itemClass !== "") {
        classes.add(item.itemClass);
      }
    }

    // extra classes
    const extraClasses = ["Vault Keys", "Quest Items", "Misc Map Items"];
    for (const extraClass of extraClasses) {
      classes.add(extraClass);
    }

    this.hierarchy = this.generateHierarchy(items);
    this.itemTable = itemTable;
    this.names = names;
    // Mutate existing array to preserve references (used by conditionTypes)
    this.classes.length = 0;
    this.classes.push(...Array.from(classes).sort());
    this.searchIndex = new Fuse(items, options);
  }

  initV2(items: Item[], patch: string) {
    this.patch = patch;
    this.allItems = items;
    const options = {
      keys: ["name", "category", "class", "type"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };

    const itemTable: { [key: string]: { [key: string]: Item } } = {};
    const classes = new Set<string>();
    const names = new Set<string>();

    for (const item of items) {
      // lookup table
      if (!itemTable[item.category]) {
        itemTable[item.category] = {};
      }
      itemTable[item.category][item.name] = item;

      names.add(item.name);

      // classes
      if (item.itemClass && item.itemClass !== "") {
        classes.add(item.itemClass);
      }
    }

    // extra classes
    const extraClasses = ["Vault Keys", "Quest Items", "Misc Map Items"];
    for (const extraClass of extraClasses) {
      classes.add(extraClass);
    }

    this.hierarchy = this.generateHierarchy(items);
    this.itemTable = itemTable;
    this.names = names;
    // Mutate existing array to preserve references (used by conditionTypes)
    this.classes.length = 0;
    this.classes.push(...Array.from(classes).sort());
    this.searchIndex = new Fuse(items, options);
  }

  generateHierarchy(items: Item[]) {
    const hierarchy: Hierarchy = {};
    for (const item of items) {
      // hierarchy
      let path = [item.category, item.class];
      if (item.type) path.push(item.type);

      if (item.category === "Armour") {
        path = [item.category, item.type || "Unknown Type", item.class];
      }

      path.push(item.name);
      recursivelySetKeys(hierarchy, path, item);
    }
    return hierarchy;
  }

  search(...args: Parameters<Fuse<Item>["search"]>): FuseResult<Item>[] {
    if (!this.searchIndex) {
      return [];
    }
    if (!args || (typeof args[0] === "string" && !args[0].length)) {
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(...args);
  }
}

export const itemIndex = new ItemIndex();
