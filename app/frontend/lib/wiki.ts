import { toast } from "solid-sonner";
import { proxyFetch } from "./fetch";
import type { IDBManager } from "./idb";

export type Unique = {
  name: string;
  base: string;
};

const CARGO_LIMIT = 500;
const REQUEST_DELAY_MS = 1000;
const MAX_RETRIES = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await proxyFetch(url, init);
    if (res.ok) return res;
    if (attempt < MAX_RETRIES - 1) {
      await delay(REQUEST_DELAY_MS * (attempt + 1));
    } else {
      throw new Error(`Failed to query wiki: ${res.status} ${res.statusText}`);
    }
  }
  throw new Error("Unreachable");
}

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
    const targetUrl = `https://www.poe${patch.startsWith("4") ? "2" : ""}wiki.net/w/api.php?action=cargoquery&tables=items&fields=items.name,items.base_item&where=items.rarity=%22Unique%22&format=json&limit=${CARGO_LIMIT}&offset=${offset}`;

    const req = await fetchWithRetry(targetUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const res = await req.json();
    if (res.cargoquery.length) {
      if (onProgress) onProgress(results.length + res.cargoquery.length);
      await delay(REQUEST_DELAY_MS);
      return this.queryWiki(
        patch,
        offset + CARGO_LIMIT,
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
