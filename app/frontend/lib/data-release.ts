import type { Item } from "./filter";
import type { MinimapCoords } from "./minimap";
import type { Mod } from "./mods";
import { proxyFetch } from "./fetch";

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

interface CachedPatchData {
  items: Item[];
  mods: Mod[];
  minimap: MinimapCoords;
}

const patchDataCache = new Map<string, CachedPatchData>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await proxyFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

export async function fetchDataRelease(
  patch: string,
  onProgress?: (percent: number, msg: string) => void,
): Promise<DataRelease> {
  const game = patch.startsWith("4.") ? "poe2" : "poe1";
  const tag = `data-${game}-${patch}`;
  const base = `${RELEASE_BASE}/${tag}`;

  let items: Item[];
  let mods: Mod[];
  let minimap: MinimapCoords;

  const cached = patchDataCache.get(patch);
  if (cached) {
    console.log(`[data-release] using cached patch data for ${patch}`);
    items = cached.items;
    mods = cached.mods;
    minimap = cached.minimap;
    if (onProgress) onProgress(50, "Loaded cached patch data");
  } else {
    if (onProgress) onProgress(0, "Downloading item data...");
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
    patchDataCache.set(patch, { items, mods, minimap });
    if (onProgress) onProgress(50, "Downloaded patch data");
  }

  if (onProgress) onProgress(60, "Downloading unique data...");
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
