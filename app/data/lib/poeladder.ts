const BASE_URL = "https://poeladder.com/api/v1";

export interface PoeladderUnique {
  name: string;
  grouping: string;
  base: string;
  category: string;
  tier: number | null;
  league: string | null;
  owned: boolean;
  altOwned: boolean;
}

export async function fetchAllUniques(
  leagueSlug: string,
): Promise<PoeladderUnique[]> {
  const url = `${BASE_URL}/users/_/leagues/${leagueSlug}/filters?display=all`;
  console.log(`Fetching poeladder uniques for ${leagueSlug}...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Poeladder API error: ${res.status} ${res.statusText}`);
  }

  const uniques = (await res.json()) as PoeladderUnique[];
  console.log(`Poeladder returned ${uniques.length} uniques`);
  return uniques;
}
