import { type ItemHierarchy, Filter } from "@app/services/filter";
import { recursivelySetKeys } from "@pkgs/lib/utils";
import data from "@pkgs/assets/data.json";

function rollup(
  data: Record<string, unknown>,
  parent: ItemHierarchy,
): ItemHierarchy {
  if (data?.file && typeof data.file === "string") {
    parent.icon = `packages/assets/images/${data.file.replaceAll("/", "@").replace("dds", "png")}`;
    parent.value = data.value as number | null;
    parent.type = "item";
    return parent;
  }

  const entries = Object.entries(data);

  for (const entry of entries) {
    const child = {
      name: entry[0],
      parent,
      enabled: true,
      type: "category",
      children: [],
    };
    parent.children.push(child);
    rollup(entry[1] as Record<string, unknown>, child);
    parent.children.sort((a, b) => (b.value || 0) - (a?.value || 0));
  }
  return parent;
}

function getType(entry: {
  isVaalGem: number | null;
  str: number | null;
  dex: number | null;
  int: number | null;
  armMax: number | null;
  evaMax: number | null;
  esMax: number | null;
  wardMax: number | null;
}): string | null {
  const { str, dex, int, armMax, evaMax, esMax, wardMax, isVaalGem } = entry;

  if (str && dex && int) {
    return "Misc";
  }

  if (isVaalGem) {
    return "Vaal";
  }

  if (str || dex || int) {
    const normalisedStr = str ?? 0;
    const normalisedDex = dex ?? 0;
    const normalisedInt = int ?? 0;

    if (normalisedStr > normalisedDex && normalisedStr > normalisedInt) {
      return "Strength";
    }
    if (normalisedDex > normalisedStr && normalisedDex > normalisedInt) {
      return "Dexterity";
    }
    if (normalisedInt > normalisedStr && normalisedInt > normalisedDex) {
      return "Intelligence";
    }
  }

  if (armMax && evaMax && esMax) {
    return "Hybrid";
  }
  if (armMax && evaMax) {
    return "Armour / Evasion";
  }
  if (armMax && esMax) {
    return "Armour / Energy Shield";
  }
  if (evaMax && esMax) {
    return "Evasion / Energy Shield";
  }
  if (armMax) {
    return "Armour";
  }
  if (evaMax) {
    return "Evasion";
  }
  if (esMax) {
    return "Energy Shield";
  }
  if (wardMax) {
    return "Ward";
  }

  if (armMax === 0 && evaMax === 0 && esMax === 0 && wardMax === 0) {
    return "Misc";
  }

  return null;
}

function generateItems(
  rawData: {
    pool: string;
    major_category: string;
    sub_category: string;
    base: string;
    file: string;
    value: number | null;
    str: number | null;
    dex: number | null;
    int: number | null;
    isVaalGem: number | null;
    armMin: number | null;
    armMax: number | null;
    evaMin: number | null;
    evaMax: number | null;
    esMin: number | null;
    esMax: number | null;
    wardMin: number | null;
    wardMax: number | null;
  }[],
) {
  const hierarchy: Record<string, unknown> = {};
  for (const entry of rawData) {
    const {
      pool,
      major_category,
      sub_category,
      base,
      file,
      value,
      str,
      dex,
      int,
      isVaalGem,
      armMin,
      armMax,
      evaMin,
      evaMax,
      esMin,
      esMax,
      wardMin,
      wardMax,
    } = entry;

    const type = getType(entry);

    const primaryCategory =
      major_category === sub_category ||
      major_category === sub_category.substring(0, sub_category.length - 1)
        ? sub_category
        : major_category;

    recursivelySetKeys(
      hierarchy,
      [pool, primaryCategory, sub_category, type, base],
      {
        file,
        value,
        str,
        dex,
        int,
        isVaalGem,
        armMin,
        armMax,
        evaMin,
        evaMax,
        esMin,
        esMax,
        wardMin,
        wardMax,
      },
    );
  }

  return rollup(hierarchy, {
    name: "Items",
    parent: undefined,
    type: "root",
    children: [],
  });
}

export async function generate(
  name: string,
  poeVersion: number,
): Promise<Filter> {
  if (poeVersion !== 1) {
    throw new Error("Only PoE 1 is currently supported");
  }
  const rules = generateItems(data);
  const now = new Date().toISOString();
  return new Filter({ name, version: 1, lastUpdated: now, rules });
}
