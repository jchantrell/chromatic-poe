import { type DBSchema, openDB } from "idb";
import { toast } from "solid-sonner";

type Unique = {
  name: string;
  base: string;
};

interface WikiCacheSchema extends DBSchema {
  uniques: {
    key: string;
    value: Unique;
  };
}

export class WikiManager {
  private dbPromise = openDB<WikiCacheSchema>("poe-wiki-cache", 1, {
    upgrade(db) {
      db.createObjectStore("uniques");
    },
  });

  async getUniques(gameVersion: number): Promise<Unique[]> {
    const db = await this.dbPromise;
    const cacheKey = `${gameVersion}/Tabula Rasa`;
    const exists = await db.get("uniques", cacheKey);

    if (!exists) {
      toast.error("Could not find unique. Please clear cache and resync.");
    }

    console.log("Getting unique bases from cache...");
    return await db.getAll("uniques");
  }

  async queryWiki(
    gameVersion: number,
    offset: number,
    results: unknown[],
  ): Promise<Unique[]> {
    const proxyUrl =
      import.meta.env.VITE_CORS_PROXY_URL || "https://corsproxy.io/?";
    const targetUrl = `https://www.poe${gameVersion === 2 ? "2" : ""}wiki.net/w/api.php?action=cargoquery&tables=items&fields=items.name,items.base_item&where=items.rarity=%22Unique%22&format=json&offset=${offset}`;
    const url = `${proxyUrl}${encodeURIComponent(targetUrl)}`;

    const req = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const res = await req.json();
    if (res.cargoquery.length) {
      return this.queryWiki(gameVersion, offset + 50, [
        ...results,
        ...res.cargoquery,
      ]);
    }

    const uniques: Unique[] = [];

    const db = await this.dbPromise;
    for (const uniq of [...results, res.cargoquery]) {
      const cacheKey = `${gameVersion}/${uniq.title.name}`;
      const v: Unique = {
        name: uniq.title.name,
        base: uniq.title["base item"],
      };
      uniques.push(v);
      await db.put("uniques", v, cacheKey);
    }

    return uniques;
  }

  async getCached(patch: string, name: string): Promise<Unique | undefined> {
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const cacheKey = `${gameVersion}/${name}`;

    const db = await this.dbPromise;
    return await db.get("uniques", cacheKey);
  }
}
