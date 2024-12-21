import Fuse, { type FuseResult } from "fuse.js";
import items from "@pkgs/data/poe2/items.json";

type Item = (typeof items)[0];

class ItemIndex {
  index: Fuse<Item>;

  constructor() {
    const options = {
      keys: ["name", "category", "class", "type"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };

    this.index = new Fuse(items, options);
  }

  search(args: { [key: string]: string }): FuseResult<Item>[] {
    return this.index.search(args);
  }
}

export const itemIndex = new ItemIndex();
