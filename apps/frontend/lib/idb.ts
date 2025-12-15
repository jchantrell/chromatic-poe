import { type DBSchema, openDB } from "idb";
import type { ChromaticConfiguration } from "./config";
import type { Filter } from "./filter";
import type { MinimapCoords } from "./minimap";
import type { Mod } from "./mods";
import type { Sound } from "./sounds";
import type { Unique } from "./wiki";

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
  sounds: {
    key: string;
    value: Sound;
  };
}

export class IDBManager {
  private dbPromise = openDB<Schema>("chromatic-poe", 1, {
    upgrade(db) {
      db.createObjectStore("bundles");
      db.createObjectStore("uniques");
      db.createObjectStore("images");
      db.createObjectStore("minimap");
      db.createObjectStore("mods");
      db.createObjectStore("filters");
      db.createObjectStore("config");
      db.createObjectStore("sounds");
    },
  });

  async getInstance() {
    return await this.dbPromise;
  }
}
