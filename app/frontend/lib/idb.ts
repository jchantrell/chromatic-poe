import { type DBSchema, openDB } from "idb";
import type { ChromaticConfiguration } from "./config";
import type { Filter, Item } from "./filter";
import type { MinimapCoords } from "./minimap";
import type { Mod } from "./mods";
import type { PoeladderUnique } from "./poeladder";
import type { Sound } from "./sounds";
import type { Unique } from "./wiki";

export interface MissingUniquesCache {
  uniques: PoeladderUnique[];
  lastRefreshed: string;
}

interface Schema extends DBSchema {
  config: {
    key: string;
    value: ChromaticConfiguration;
  };
  filters: {
    key: string;
    value: Filter;
  };
  bundles: {
    key: string;
    value: ArrayBuffer;
  };
  uniques: {
    key: string;
    value: Unique;
  };
  images: {
    key: string;
    value: Blob;
  };
  minimap: {
    key: string;
    value: MinimapCoords;
  };
  mods: {
    key: string;
    value: Mod[];
  };
  items: {
    key: string;
    value: Item[];
  };
  sounds: {
    key: string;
    value: Sound;
  };
  missingUniques: {
    key: string;
    value: MissingUniquesCache;
  };
  allUniques: {
    key: string;
    value: MissingUniquesCache;
  };
}

export class IDBManager {
  private dbPromise = openDB<Schema>("chromatic-poe", 4, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("bundles");
        db.createObjectStore("uniques");
        db.createObjectStore("images");
        db.createObjectStore("minimap");
        db.createObjectStore("mods");
        db.createObjectStore("filters");
        db.createObjectStore("config");
        db.createObjectStore("sounds");
      }
      if (oldVersion < 2) {
        db.createObjectStore("missingUniques");
      }
      if (oldVersion < 3) {
        db.createObjectStore("allUniques");
      }
      if (oldVersion < 4) {
        db.createObjectStore("items");
      }
    },
  });

  async getInstance() {
    return await this.dbPromise;
  }
}
