import Fuse, { type FuseResult } from "fuse.js";
import items from "@pkgs/data/poe2/items.json";
import { recursivelySetKeys } from "@pkgs/lib/utils";

type Item = (typeof items)[0];
type Hierarchy = { [key: string]: Item | Hierarchy };

class ItemIndex {
  searchIndex: Fuse<Item>;
  hierarchy: Hierarchy;
  classes: string[];
  itemTable: { [key: string]: { [key: string]: Item } };

  constructor() {
    const options = {
      keys: ["name", "category", "class", "type"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };

    const hierarchy: Hierarchy = {};
    const itemTable: { [key: string]: { [key: string]: Item } } = {};
    const classes = new Set<string>();

    for (const item of items) {
      // lookup table
      if (!itemTable[item.category]) {
        itemTable[item.category] = {};
      }
      itemTable[item.category][item.name] = item;

      // classes
      if (item.itemClass && item.itemClass !== "") {
        classes.add(item.itemClass);
      }

      // hierarchy
      let path = [item.category, item.class];
      if (item.type) path.push(item.type);

      if (item.category === "Armour") {
        path = [item.category, item.type, item.class];
      }

      path.push(item.name);
      recursivelySetKeys(hierarchy, path, item);
    }

    // extra classes
    const extraClasses = ["Vault Keys", "Quest Items"];
    for (const extraClass of extraClasses) {
      classes.add(extraClass);
    }

    this.hierarchy = hierarchy;
    this.itemTable = itemTable;
    this.classes = Array.from(classes);
    this.searchIndex = new Fuse(items, options);
  }

  search(args: { [key: string]: string }): FuseResult<Item>[] {
    return this.searchIndex.search(args);
  }
}

export const itemIndex = new ItemIndex();
