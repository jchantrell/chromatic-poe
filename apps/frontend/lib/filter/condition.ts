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
  // internal
  baseType(op: Operator, bases: string[]): string {
    return `BaseType ${op} ${bases.map((e) => `"${e}"`).join(" ")}`;
  }
  class(op: Operator, className: ClassName, ...rest: ClassName[]): string {
    return `Class ${op} "${className}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }

  // general
  height(op: Operator, height: IntRange<1, 4>): string {
    return `Height ${op} ${height}`;
  }
  width(op: Operator, width: IntRange<1, 2>): string {
    return `Width ${op} ${width}`;
  }
  areaLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `AreaLevel ${op} ${lvl}`;
  }
  dropLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `DropLevel ${op} ${lvl}`;
  }

  // stackables
  stackSize(op: Operator, size: number): string {
    return `StackSize ${op} ${size}`;
  }

  // quality (gear, gems, maps)
  quality(op: Operator, qual: IntRange<0, 100>): string {
    return `Quality ${op} ${qual}`;
  }

  // gems
  gemLevel(op: Operator, lvl: IntRange<1, 21>): string {
    return `GemLevel ${op} ${lvl}`;
  }
  alternateQuality(bool: boolean): string {
    return `AlternateQuality ${bool}`;
  }
  transfiguredGem(bool: boolean): string {
    return `TransfiguredGem "${bool}"`;
  }

  // maps
  mapTier(
    op: Operator,
    tier: IntRange<1, 17>,
    ...rest: IntRange<1, 17>[]
  ): string {
    return `MapTier ${op} "${tier}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
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
  uberBlightedMap(bool: boolean): string {
    return `UberBlightedMap "${bool}"`;
  }

  // gear & maps (general)
  itemLevel(op: Operator, lvl: IntRange<0, 100>): string {
    return `ItemLevel ${op} ${lvl}`;
  }
  rarity(op: Operator, rarity: Rarity): string {
    return `Rarity ${op} ${rarity}`;
  }
  identified(bool: boolean): string {
    return `Identified ${bool}`;
  }
  hasImplicitMod(bool: boolean): string {
    return `HasImplicitMod ${bool}`;
  }
  scourged(bool: boolean): string {
    return `Scourged "${bool}"`;
  }
  fracturedItem(bool: boolean): string {
    return `FracturedItem ${bool}`;
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
  hasExplicitMod(mod: string, ...rest: string[]): string {
    return `HasExplicitMod "${mod}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  anyEnchantment(bool: boolean): string {
    return `AnyEnchantment ${bool}`;
  }
  hasEnchantment(enchant: string, ...rest: string[]): string {
    return `HasEnchantment "${enchant}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }

  // gear(socketable)
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

  // gear (clusters)
  enchantmentPassiveNode(enchant: string, ...rest: string[]): string {
    return `EnchantmentPassiveNode "${enchant}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  enchantmentPassiveNum(op: Operator, number: IntRange<2, 12>): string {
    return `EnchantmentPassiveNum ${op} ${number}`;
  }

  // gear (weapons)
  hasCruciblePassiveTree(bool: boolean): string {
    return `HasCruciblePassiveTree ${bool}`;
  }

  // gear (armour)
  baseDefencePercentile(op: Operator, value: number): string {
    return `BaseDefencePercentile ${op} ${value}`;
  }
  baseArmour(op: Operator, value: number): string {
    return `BaseArmour ${op} ${value}`;
  }
  baseEnergyShield(op: Operator, value: number): string {
    return `BaseEnergyShield ${op} ${value}`;
  }
  baseEvasion(op: Operator, value: number): string {
    return `BaseEvasion ${op} ${value}`;
  }
  baseWard(op: Operator, value: number): string {
    return `BaseWard ${op} ${value}`;
  }

  // gear (influence)
  hasInfluence(influence: Influence, ...rest: Influence[]): string {
    return `HasInfluence "${influence}"${rest ? rest.map((entry) => ` "${entry}"`) : ""}`;
  }
  hasSearingExarchImplicit(op: Operator, amount: IntRange<0, 6>): string {
    return `HasSearingExarchImplicit ${op} ${amount}`;
  }
  hasEaterOfWorldsImplicit(op: Operator, amount: IntRange<0, 6>): string {
    return `HasEaterOfWorldsImplicit ${op} ${amount}`;
  }

  // gear (synth)
  synthesisedItem(bool: boolean): string {
    return `SynthesisedItem ${bool}`;
  }

  // gear (uniques)
  replica(bool: boolean): string {
    return `Replica ${bool}`;
  }

  // archhem
  archnemesisMod(modName: string): string {
    return `ArchnemesisMod "${modName}"`;
  }
}

export const conditions = new ConditionBuilder();
