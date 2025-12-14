import { type DBSchema, openDB } from "idb";
import type { MinimapCoords } from "./minimap";
import type { Mod } from "./mods";
import type { Unique } from "./wiki";

interface Schema extends DBSchema {
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
}

export class IDBManager {
  private dbPromise = openDB<Schema>("chromatic-poe", 1, {
    upgrade(db) {
      db.createObjectStore("bundles");
      db.createObjectStore("uniques");
      db.createObjectStore("images");
      db.createObjectStore("minimap");
      db.createObjectStore("mods");
    },
  });

  async getInstance() {
    return await this.dbPromise;
  }
}
