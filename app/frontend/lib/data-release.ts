import { proxyFetch } from "./fetch";
import type { Item } from "./filter";
import type { IDBManager } from "./idb";
import type { MinimapCoords } from "./minimap";
import type { Mod } from "./mods";
import { to } from "./utils";

const RELEASE_BASE =
  "https://github.com/jchantrell/chromatic-poe/releases/download";

interface UniqueOutput {
  name: string;
  base: string | null;
  category: string;
  class: string | null;
  type: string | null;
  score: number;
  art: string | null;
  height: number | null;
  width: number | null;
  itemClass: string | null;
  gemFx: string | null;
  dropEnabledStandard: boolean;
  dropEnabledLeague: boolean;
  poeladder: {
    grouping: string;
    category: string;
    tier: number | null;
    league: string | null;
  } | null;
}

export interface DataRelease {
  items: Item[];
  mods: Mod[];
  minimap: MinimapCoords;
  uniques: UniqueOutput[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = url.startsWith("/")
    ? await fetch(url)
    : await proxyFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

export async function fetchDataRelease(
  idb: IDBManager,
  patch: string,
  onProgress?: (percent: number, msg: string) => void,
): Promise<DataRelease> {
  const game = patch.startsWith("4.") ? "poe2" : "poe1";
  const tag = `data-${game}-${patch}`;
  const base = `${RELEASE_BASE}/${tag}`;
  const cacheKey = `${tag}/release`;

  const db = await idb.getInstance();
  const [cachedItems, cachedMods, cachedMinimap] = await Promise.all([
    db.get("items", cacheKey),
    db.get("mods", cacheKey),
    db.get("minimap", cacheKey),
  ]);

  let items: Item[];
  let mods: Mod[];
  let minimap: MinimapCoords;

  if (cachedItems && cachedMods && cachedMinimap) {
    console.log(`[data-release] using cached patch data for ${patch}`);
    items = cachedItems;
    mods = cachedMods;
    minimap = cachedMinimap;
    if (onProgress) onProgress(90, "Loaded cached patch data");
  } else {
    if (onProgress) onProgress(85, "Downloading item data...");
    console.log(`[data-release] fetching ${base}/items.json`);
    const [itemsResult, modsResult, minimapResult] = await Promise.all([
      fetchJson<Item[]>(`${base}/items.json`),
      fetchJson<Mod[]>(`${base}/mods.json`),
      fetchJson<MinimapCoords>(`${base}/minimap.json`),
    ]);
    console.log("[data-release] patch data downloaded");
    items = itemsResult;
    mods = modsResult;
    minimap = minimapResult;
    const [cacheErr] = await to(
      Promise.all([
        db.put("items", items, cacheKey),
        db.put("mods", mods, cacheKey),
        db.put("minimap", minimap, cacheKey),
      ]),
    );
    if (cacheErr) {
      console.warn("[data-release] failed to cache patch data", cacheErr);
    }
    if (onProgress) onProgress(90, "Downloaded patch data");
  }

  if (onProgress) onProgress(95, "Downloading unique data...");
  console.log(`[data-release] fetching ${base}/uniques.json`);
  const uniques = await fetchJson<UniqueOutput[]>(`${base}/uniques.json`).catch(
    (err) => {
      console.warn("[data-release] uniques fetch failed:", err);
      return [] as UniqueOutput[];
    },
  );

  if (onProgress) onProgress(100, "Done");
  return { items, mods, minimap, uniques };
}
