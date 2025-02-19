import Fuse, { type FuseResult } from "fuse.js";
import mods from "@pkgs/data/poe2/mods.json";

type SearchableMod = {
  name: string;
  tags: string[];
  type: string;
  position: "prefix" | "suffix" | "affix";
  bases: string[];
  searchStats: {
    label: string;
    description: string;
  }[];
};

class ModIndex {
  searchIndex!: Fuse<SearchableMod>;

  constructor() {
    this.setMods(
      mods.map((mod) => ({
        ...mod,
        searchStats: mod.stats.flat(),
      })) as SearchableMod[],
    );
  }

  setMods(mods: SearchableMod[]) {
    const options = {
      keys: ["name", "tags", "bases", "searchStats.description"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };
    this.searchIndex = new Fuse(mods, options);
  }

  search(
    args: Parameters<typeof this.searchIndex.search>[0],
  ): FuseResult<SearchableMod>[] {
    // handle empty search
    if (!args || (typeof args === "string" && !args.length)) {
      console.log("empty search");
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(`'${args}`);
  }
}

export const modIndex = new ModIndex();
