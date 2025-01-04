import Fuse, { type FuseResult } from "fuse.js";
import items from "@pkgs/data/poe2/items.json";
import { recursivelySetKeys } from "@pkgs/lib/utils";

type Item = (typeof items)[0];
type Hierarchy = { [key: string]: Item | Hierarchy };

class ItemIndex {
  searchIndex: Fuse<Item>;
  hierarchy: Hierarchy;

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

    for (const item of items) {
      let path = [item.category, item.class];
      if (item.type) path.push(item.type);

      if (item.category === "Armour") {
        path = [item.category, item.type, item.class];
      }

      path.push(item.name);
      recursivelySetKeys(hierarchy, path, item);
    }

    this.hierarchy = hierarchy;
    this.searchIndex = new Fuse(items, options);
  }

  search(args: { [key: string]: string }): FuseResult<Item>[] {
    return this.searchIndex.search(args);
  }
}

export const itemIndex = new ItemIndex();
