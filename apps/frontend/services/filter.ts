import { clone } from "@pkgs/lib/utils";
import { fileSystem } from "@app/services/storage";

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
