import type { UniqueCollectionDisplay } from "@app/lib/filter";
import { proxyFetch } from "@app/lib/fetch";
import { toast } from "solid-sonner";

const BASE_URL = "https://poeladder.com/api/v1";

/** A league the user is registered for on poeladder. */
export interface PoeladderLeague {
  name: string;
  isPoe2: boolean;
  url: string;
}

/** A unique item entry from the poeladder filters API. */
export interface PoeladderUnique {
  name: string;
  grouping: string;
  base: string;
  category: string;
  league: string | null;
  owned: boolean;
  altOwned: boolean;
}

/**
 * Fetch all leagues a user is registered for on poeladder.
 * Returns empty array and toasts on failure.
 */
export async function fetchLeagues(
  username: string,
): Promise<PoeladderLeague[]> {
  try {
    const res = await proxyFetch(`${BASE_URL}/users/${username}/filters`);
    if (!res.ok) {
      toast.error(`Could not find "${username}" on poeladder`, {
        description: `API returned ${res.status}. Check your username in settings.`,
      });
      return [];
    }
    return (await res.json()) as PoeladderLeague[];
  } catch (err) {
    toast.error("Failed to reach poeladder API", {
      description: String(err),
    });
    return [];
  }
}

/**
 * Fetch missing uniques for a user in a specific league.
 * - "league": no display param — missing in that league only
 * - "combined": ?display=missing — missing when combining standard + temp league
 * Returns empty array and toasts on failure.
 */
export async function fetchMissingUniques(
  username: string,
  leagueSlug: string,
  display: UniqueCollectionDisplay = "league",
): Promise<PoeladderUnique[]> {
  try {
    const url =
      display === "combined"
        ? `${BASE_URL}/users/${username}/leagues/${leagueSlug}/filters?display=missing`
        : `${BASE_URL}/users/${username}/leagues/${leagueSlug}/filters`;
    const res = await proxyFetch(url);
    if (!res.ok) {
      toast.error(
        `Could not fetch uniques for "${username}" in ${leagueSlug}`,
        {
          description: `API returned ${res.status}. Check your username and league.`,
        },
      );
      return [];
    }
    return (await res.json()) as PoeladderUnique[];
  } catch (err) {
    toast.error("Failed to reach poeladder API", {
      description: String(err),
    });
    return [];
  }
}

export async function fetchAllUniques(
  leagueSlug: string,
): Promise<PoeladderUnique[]> {
  try {
    const res = await proxyFetch(
      `${BASE_URL}/users/_/leagues/${leagueSlug}/filters?display=all`,
    );
    if (!res.ok) {
      toast.error(`Could not fetch unique list for ${leagueSlug}`, {
        description: `API returned ${res.status}.`,
      });
      return [];
    }
    return (await res.json()) as PoeladderUnique[];
  } catch (err) {
    toast.error("Failed to reach poeladder API", {
      description: String(err),
    });
    return [];
  }
}

/**
 * Extract the league slug from a poeladder league URL.
 * e.g. "https://poeladder.com/api/v1/users/foo/leagues/SSF_Standard/filters" → "SSF_Standard"
 */
export function leagueSlugFromUrl(url: string): string {
  const match = url.match(/\/leagues\/([^/]+)\//);
  return match?.[1] ?? "";
}

/**
 * Convert poeladder uniques to the base type strings used by PoE filters.
 * Returns deduplicated base names.
 */
export function uniquesToBaseTypes(uniques: PoeladderUnique[]): string[] {
  return Array.from(new Set(uniques.map((u) => u.base)));
}
