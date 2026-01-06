import { toast } from "solid-sonner";
import type { IDBManager } from "./idb";

export type Unique = {
  name: string;
  base: string;
};

export class WikiManager {
  constructor(private db: IDBManager) {}

  async getUniques(patch: string): Promise<Unique[]> {
    const db = await this.db.getInstance();
    const cacheKey = `${patch}/Tabula Rasa`;
    const exists = await db.get("uniques", cacheKey);

    if (!exists) {
      toast.error("Could not find unique. Please clear cache and resync.");
    }

    console.log("Getting unique bases from cache...");
    return await db.getAll("uniques");
  }

  async queryWiki(
    patch: string,
    offset: number,
    results: unknown[],
    onProgress?: (count: number) => void,
  ): Promise<Unique[]> {
    const targetUrl = `https://www.poe${patch.startsWith("4") ? "2" : ""}wiki.net/w/api.php?action=cargoquery&tables=items&fields=items.name,items.base_item&where=items.rarity=%22Unique%22&format=json&offset=${offset}`;

    const req = await fetch(
      `${import.meta.env.VITE_PROXY_API_HOST}?url=${encodeURIComponent(targetUrl)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
    const res = await req.json();
    if (res.cargoquery.length) {
      if (onProgress) onProgress(results.length + res.cargoquery.length);
      return this.queryWiki(
        patch,
        offset + 50,
        [...results, ...res.cargoquery],
        onProgress,
      );
    }

    const uniques: Unique[] = [];

    const db = await this.db.getInstance();
    for (const uniq of [...results, ...res.cargoquery]) {
      const cacheKey = `${patch}/${uniq.title.name}`;
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
    const cacheKey = `${patch}/${name}`;

    const db = await this.db.getInstance();
    return await db.get("uniques", cacheKey);
  }
}
