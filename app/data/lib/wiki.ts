import { decodeEntities } from "../../frontend/lib/html.js";

export interface Unique {
  name: string;
  base: string;
}

const CARGO_LIMIT = 500;
const REQUEST_DELAY_MS = 1000;
const MAX_RETRIES = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    if (res.ok) return res;
    if (attempt < MAX_RETRIES - 1) {
      await delay(REQUEST_DELAY_MS * (attempt + 1));
    } else {
      throw new Error(`Failed to query wiki: ${res.status} ${res.statusText}`);
    }
  }
  throw new Error("Unreachable");
}

export async function queryWiki(patch: string): Promise<Unique[]> {
  const wikiDomain = patch.startsWith("4")
    ? "www.poe2wiki.net"
    : "www.poewiki.net";

  const allResults: Unique[] = [];
  let offset = 0;

  while (true) {
    const url = `https://${wikiDomain}/w/api.php?action=cargoquery&tables=items&fields=items.name,items.base_item&where=items.rarity=%22Unique%22&format=json&limit=${CARGO_LIMIT}&offset=${offset}`;

    console.log(`Wiki query offset=${offset}...`);
    const res = await fetchWithRetry(url);
    const data = await res.json();

    if (!data.cargoquery?.length) break;

    for (const entry of data.cargoquery) {
      allResults.push({
        name: decodeEntities(entry.title.name),
        base: decodeEntities(entry.title["base item"] ?? ""),
      });
    }

    offset += CARGO_LIMIT;
    await delay(REQUEST_DELAY_MS);
  }

  console.log(`Wiki returned ${allResults.length} uniques`);
  return allResults;
}
