import { clone } from "@pkgs/lib/utils";
import { fileSystem } from "@app/services/storage";
import { recursivelySetKeys } from "@pkgs/lib/utils";
import data from "@pkgs/data/raw.json";

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> =
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T;

type RgbRange = IntRange<0, 255>;

export type ItemHierarchy = {
  name: string;
  icon?: string;
  value?: number | null;
  type: "root" | "category" | "rule" | "item";
  enabled?: boolean;
  parent: ItemHierarchy | undefined;
  children: ItemHierarchy[];
};

export interface Rule {
  visible: boolean;
  conditions: { [key: string]: string[] }[];
  actions: { [key: string]: string[] }[];
}

export interface Section {
  id: string;
  description: string;
  rules: Rule[];
  subsections: Section[];
}

export interface StoredFilter {
  name: string;
  version: number;
  lastUpdated: string;
  rules: ItemHierarchy;
}
export enum Block {
  show = "Show",
  hide = "Hide",
  continue = "Continue",
}

export enum Operator {
  eq = "==",
  neq = "!",
  lt = "<",
  lte = "<=",
  gt = ">",
  gte = ">=",
}

export enum Color {
  red = "Red",
  green = "Green",
  blue = "Blue",
  brown = "Brown",
  white = "White",
  yellow = "Yellow",
  cyan = "Cyan",
  grey = "Grey",
  orange = "Orange",
  pink = "Pink",
  purple = "Purple",
}

export enum Shape {
  circle = "Circle",
  diamond = "Diamond",
  hexagon = "Hexagon",
  square = "Square",
  star = "Star",
  triangle = "Triangle",
  cross = "Cross",
  moon = "Moon",
  raindrop = "Raindrop",
  kite = "Kite",
  pentagon = "Pentagon",
  upsideDownHouse = "UpsideDownHouse",
}

export enum Beam {
  perm = "",
  temp = "Temp",
}

export enum Rarity {
  normal = "Normal",
  magic = "Magic",
  rare = "Rare",
  unique = "Unique",
}

export enum ClassName {
  amulets = "Amulets",
  belts = "Belts",
}

export enum Influence {
  elder = "Elder",
  shaper = "Shaper",
  crusader = "Crusader",
  redeemer = "Redeemer",
  hunter = "Hunter",
  warlord = "Warlord",
  none = "None",
}

export class Filter {
  name: string;
  version: number;
  lastUpdated: Date;
  rules: ItemHierarchy;

  constructor(params: StoredFilter) {
    this.name = params.name;
    this.version = params.version;
    this.lastUpdated = new Date(params.lastUpdated);
    this.rules = params.rules;
  }

  copy() {
    this.marshall();
    const copy = new Filter(clone(this));
    copy.unmarshall();
    this.unmarshall();
    return copy;
  }

  updateName(newName: string) {
    this.name = newName;
    this.lastUpdated = new Date();
  }

  async writeFile() {
    await fileSystem.writeFilter(this);
  }

  marshall() {
    this.removeParentRefs(this.rules);
  }

  unmarshall() {
    this.addParentRefs(this.rules);
  }

  removeParentRefs(hierarchy: ItemHierarchy) {
    hierarchy.parent = undefined;
    for (const child of hierarchy.children) {
      this.removeParentRefs(child);
    }
  }

  addParentRefs(hierarchy: ItemHierarchy) {
    for (const child of hierarchy.children) {
      child.parent = hierarchy;
      this.addParentRefs(child);
    }
  }
}

export class ConditionBuilder {
  areaLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `AreaLevel ${op} ${lvl}`;
  }
  itemLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `ItemLevel ${op} ${lvl}`;
  }
  dropLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `DropLevel ${op} ${lvl}`;
  }
  quality(op: Operator, qual: IntRange<0, 100>): string {
    return `Quality ${op} ${qual}`;
  }
  rarity(op: Operator, rarity: Rarity): string {
    return `Rarity ${op} ${rarity}`;
  }
  class(op: Operator, className: ClassName, ...rest: ClassName[]): string {
    return `Class ${op} "${className}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  baseType(op: Operator, baseType: string, ...rest: string[]): string {
    return `BaseType ${op} "${baseType}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  linkedSockets(op: Operator, links: IntRange<0, 6>): string {
    return `LinkedSockets ${op} ${links}`;
  }
  socketGroup(
    op: Operator,
    links: IntRange<0, 6>,
    combination: string,
  ): string {
    return `SocketGroup ${op} ${links}${combination}`;
  }
  sockets(op: Operator, links: IntRange<0, 6>, combination: string): string {
    return `Sockets ${op} ${links}${combination}`;
  }
  height(op: Operator, height: IntRange<1, 4>): string {
    return `Height ${op} ${height}`;
  }
  width(op: Operator, width: IntRange<1, 2>): string {
    return `Width ${op} ${width}`;
  }
  hasExplicitMod(mod: string, ...rest: string[]): string {
    return `HasExplicitMod "${mod}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  anyEnchantment(bool: boolean): string {
    return `AnyEnchantment ${bool}`;
  }
  hasEnchantment(enchant: string, ...rest: string[]): string {
    return `HasEnchantment "${enchant}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  enchantmentPassiveNode(enchant: string, ...rest: string[]): string {
    return `EnchantmentPassiveNode "${enchant}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  enchantmentPassiveNum(op: Operator, number: IntRange<2, 12>): string {
    return `EnchantmentPassiveNum ${op} ${number}`;
  }
  stackSize(op: Operator, size: IntRange<1, 5000>): string {
    return `StackSize ${op} ${size}`;
  }
  gemLevel(op: Operator, lvl: IntRange<1, 21>): string {
    return `GemLevel ${op} ${lvl}`;
  }
  replica(bool: boolean): string {
    return `Replica ${bool}`;
  }
  identified(bool: boolean): string {
    return `Identified ${bool}`;
  }
  corrupted(bool: boolean): string {
    return `Corrupted ${bool}`;
  }
  corruptedMods(op: Operator, number: IntRange<1, 2>): string {
    return `CorruptedMods ${op} ${number}`;
  }
  mirrored(bool: boolean): string {
    return `Mirrored ${bool}`;
  }
  hasInfluence(influence: Influence, ...rest: Influence[]): string {
    return `HasInfluence "${influence}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  hasSearingExarchImplicit(op: Operator, amount: IntRange<0, 6>): string {
    return `HasSearingExarchImplicit ${op} ${amount}`;
  }
  hasEaterOfWorldsImplicit(op: Operator, amount: IntRange<0, 6>): string {
    return `HasEaterOfWorldsImplicit ${op} ${amount}`;
  }
  fracturedItem(bool: boolean): string {
    return `FracturedItem ${bool}`;
  }
  synthesisedItem(bool: boolean): string {
    return `SynthesisedItem ${bool}`;
  }
  elderMap(bool: boolean): string {
    return `ElderMap ${bool}`;
  }
  shapedMap(bool: boolean): string {
    return `ShapedMap ${bool}`;
  }
  blightedMap(bool: boolean): string {
    return `BlightedMap ${bool}`;
  }
  mapTier(
    op: Operator,
    tier: IntRange<1, 17>,
    ...rest: IntRange<1, 17>[]
  ): string {
    return `MapTier ${op} "${tier}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  hasImplicitMod(bool: boolean): string {
    return `HasImplicitMod ${bool}`;
  }
  hasCruciblePassiveTree(bool: boolean): string {
    return `HasCruciblePassiveTree ${bool}`;
  }
}

export class ActionBuilder {
  setBorderColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetBorderColor ${r} ${g} ${b} ${a}`;
  }
  setTextColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetTextColor ${r} ${g} ${b} ${a}`;
  }
  setBackgroundColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetBackgroundColor ${r} ${g} ${b} ${a}`;
  }
  setFontSize(size: IntRange<18, 45>) {
    return `SetFontSize ${size}`;
  }
  playAlertSound(
    id: IntRange<1, 16>,
    volume: IntRange<0, 300>,
    positional?: boolean,
  ) {
    return `${positional ? "PlayAlertSoundPositional" : "PlayAlertSound"} ${id} ${volume}`;
  }
  dropSound(enable: boolean) {
    return enable ? "EnableDropSound" : "DisableDropSound";
  }
  customAlertSound(filePath: string) {
    return `CustomAlertSound ${filePath}`;
  }
  minimapIcon(size: IntRange<0, 2>, color: Color, shape: Shape) {
    return `MinimapIcon ${size} ${color} ${shape}`;
  }
  playEffect(color: Color, temporary?: boolean) {
    return `PlayEffect ${color}${temporary ? " Temp" : ""}`;
  }
}

function rollup(
  data: Record<string, unknown>,
  parent: ItemHierarchy,
): ItemHierarchy {
  if (data?.file && typeof data.file === "string") {
    parent.icon = `images/${data.file.replaceAll("/", "@").replace("dds", "png")}`;
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
