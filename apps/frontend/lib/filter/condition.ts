import type { IntRange } from "@pkgs/lib/types";

export enum Operator {
  eq = "==",
  neq = "!",
  lt = "<",
  lte = "<=",
  gt = ">",
  gte = ">=",
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
  baseType(op: Operator, bases: string[]): string {
    return `BaseType ${op} ${bases.map((e) => `"${e}"`).join(" ")}`;
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

export const conditions = new ConditionBuilder();
