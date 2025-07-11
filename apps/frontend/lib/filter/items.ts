import Fuse, { type FuseResult } from "fuse.js";
import itemsV1 from "@pkgs/data/poe1/items.json";
import itemsV2 from "@pkgs/data/poe2/items.json";
import { recursivelySetKeys } from "@pkgs/lib/utils";

type Item = (typeof itemsV1)[0];
type Hierarchy = { [key: string]: Item | Hierarchy };

class ItemIndex {
  searchIndex!: Fuse<Item>;
  hierarchy!: Hierarchy;
  classes!: string[];
  itemTable!: { [key: string]: { [key: string]: Item } };

  constructor() {
    this.initV1();
  }

  initV1() {
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

    for (const item of itemsV1) {
      // lookup table
      if (!itemTable[item.category]) {
        itemTable[item.category] = {};
      }
      itemTable[item.category][item.name] = item;

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

    this.hierarchy = this.generateHierarchy(itemsV1);
    this.itemTable = itemTable;
    this.classes = Array.from(classes);
    this.searchIndex = new Fuse(itemsV1, options);
  }

  initV2() {
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

    for (const item of itemsV2) {
      // lookup table
      if (!itemTable[item.category]) {
        itemTable[item.category] = {};
      }
      itemTable[item.category][item.name] = item;

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

    this.hierarchy = this.generateHierarchy(itemsV2);
    this.itemTable = itemTable;
    this.classes = Array.from(classes);
    this.searchIndex = new Fuse(itemsV2, options);
  }

  generateHierarchy(items: Item[]) {
    const hierarchy: Hierarchy = {};
    for (const item of items) {
      // hierarchy
      let path = [item.category, item.class];
      if (item.type) path.push(item.type);

      if (item.category === "Armour") {
        path = [item.category, item.type, item.class];
      }

      path.push(item.name);
      recursivelySetKeys(hierarchy, path, item);
    }
    return hierarchy;
  }

  search(
    args: Parameters<typeof this.searchIndex.search>[0],
  ): FuseResult<Item>[] {
    if (!args || (typeof args === "string" && !args.length)) {
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(args);
  }
}

export const itemIndex = new ItemIndex();
