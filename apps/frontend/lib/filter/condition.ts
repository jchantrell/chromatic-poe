import type { FilterItem } from "./filter";

type ListCondition<T> = {
  value: T[];
};

type OpListCondition<T> = {
  operator: Operator;
  value: T[];
};

type OpValueCondition<T> = {
  operator: Operator;
  value: T | string;
};

type BoolCondition = {
  value: boolean;
};

export type Conditions = {
  bases?: string[];
  classes?: OpListCondition<string>;

  height?: OpValueCondition<number>;
  width?: OpValueCondition<number>;

  areaLevel?: OpValueCondition<number>;
  dropLevel?: OpValueCondition<number>;
  stackSize?: OpValueCondition<number>;
  quality?: OpValueCondition<number>;

  gemLevel?: OpValueCondition<number>;
  transfiguredGem?: BoolCondition;

  mapTier?: OpValueCondition<number>;
  elderMap?: BoolCondition;
  shapedMap?: BoolCondition;
  blightedMap?: BoolCondition;
  uberBlightedMap?: BoolCondition;

  hasImplicitMod?: BoolCondition;
  itemLevel?: OpValueCondition<number>;
  rarity?: OpListCondition<Rarity>;
  identified?: BoolCondition;
  scourged?: BoolCondition;
  fractured?: BoolCondition;
  mirrored?: BoolCondition;
  corrupted?: BoolCondition;
  enchanted?: BoolCondition;
  synthesised?: BoolCondition;
  replica?: BoolCondition;
  crucibleTree?: BoolCondition;

  corruptedMods?: OpValueCondition<number>;

  hasExplicitMod?: ListCondition<string>;
  hasEnchantment?: ListCondition<string>;
  archnemesisMod?: ListCondition<string>;
  enchantmentPassiveNode?: ListCondition<string>;
  enchantmentPassiveNum?: OpValueCondition<number>;

  hasSearingExarchImplicit?: OpValueCondition<number>;
  hasEaterOfWorldsImplicit?: OpValueCondition<number>;
  hasInfluence?: ListCondition<Influence>;

  linkedSockets?: OpValueCondition<number>;
  sockets?: OpValueCondition<string>; // TODO: is this right?
  socketGroup?: OpValueCondition<string>;

  defencePercentile?: OpValueCondition<number>;
  armour?: OpValueCondition<number>;
  evasion?: OpValueCondition<number>;
  energyShield?: OpValueCondition<number>;
  ward?: OpValueCondition<number>;
};

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

export enum Influence {
  elder = "Elder",
  shaper = "Shaper",
  crusader = "Crusader",
  redeemer = "Redeemer",
  hunter = "Hunter",
  warlord = "Warlord",
  none = "None",
}

export function hasEnabledUniques(items: FilterItem[]): boolean {
  return items.some((item) => item.enabled && item.category === "Uniques");
}

export function hasEnabledNonUniques(items: FilterItem[]): boolean {
  return items.some((item) => item.enabled && item.category !== "Uniques");
}

// internal
function baseType(op: Operator, bases: string[]): string {
  return `BaseType ${op} ${bases.map((e) => `"${e}"`).join(" ")}`;
}
function className(op: Operator, classNames: string[]): string {
  return `Class ${op} ${classNames.map((entry) => `"${entry}"`).join(" ")}`;
}

// general
function height(op: Operator, height: number | string): string {
  return `Height ${op} ${height}`;
}
function width(op: Operator, width: number | string): string {
  return `Width ${op} ${width}`;
}
function areaLevel(op: Operator, lvl: number | string): string {
  return `AreaLevel ${op} ${lvl}`;
}
function dropLevel(op: Operator, lvl: number | string): string {
  return `DropLevel ${op} ${lvl}`;
}

// stackables
function stackSize(op: Operator, size: number | string): string {
  return `StackSize ${op} ${size}`;
}

// quality (gear, gems, maps)
function quality(op: Operator, qual: number | string): string {
  return `Quality ${op} ${qual}`;
}

// gems
function gemLevel(op: Operator, lvl: number | string): string {
  return `GemLevel ${op} ${lvl}`;
}
function alternateQuality(bool: boolean): string {
  return `AlternateQuality ${bool}`;
}
function transfiguredGem(bool: boolean): string {
  return `TransfiguredGem "${bool}"`;
}

// maps
function mapTier(op: Operator, tier: number | string): string {
  return `MapTier ${op} "${tier}"`;
}
function elderMap(bool: boolean): string {
  return `ElderMap ${bool}`;
}
function shapedMap(bool: boolean): string {
  return `ShapedMap ${bool}`;
}
function blightedMap(bool: boolean): string {
  return `BlightedMap ${bool}`;
}
function uberBlightedMap(bool: boolean): string {
  return `UberBlightedMap "${bool}"`;
}

// gear & maps (general)
function itemLevel(op: Operator, lvl: number | string): string {
  return `ItemLevel ${op} ${lvl}`;
}
function rarity(op: Operator, rarity: Rarity[]): string | null {
  if (rarity.length === 0) return null;
  return `Rarity ${op} ${rarity.map((entry) => `"${entry}"`).join(" ")}`;
}
function identified(bool: boolean): string {
  return `Identified ${bool}`;
}
function hasImplicitMod(bool: boolean): string {
  return `HasImplicitMod ${bool}`;
}
function scourged(bool: boolean): string {
  return `Scourged "${bool}"`;
}
function fractured(bool: boolean): string {
  return `FracturedItem ${bool}`;
}
function corrupted(bool: boolean): string {
  return `Corrupted ${bool}`;
}
function corruptedMods(op: Operator, number: number | string): string {
  return `CorruptedMods ${op} ${number}`;
}
function mirrored(bool: boolean): string {
  return `Mirrored ${bool}`;
}
function hasExplicitMod(mods: string[]): string {
  return `HasExplicitMod ${mods.map((entry) => `"${entry}"`).join(" ")}`;
}
function anyEnchantment(bool: boolean): string {
  return `AnyEnchantment ${bool}`;
}
function hasEnchantment(enchantments: string[]): string {
  return `HasEnchantment ${enchantments.map((entry) => `"${entry}"`).join(" ")}`;
}

// gear(socketable)
function linkedSockets(op: Operator, links: number | string): string {
  return `LinkedSockets ${op} ${links}`;
}
function socketGroup(op: Operator, groupString: string): string {
  return `SocketGroup ${op} ${groupString}`;
}
function sockets(
  op: Operator,
  amount: number | string,
  groupString?: string,
): string {
  return `Sockets ${op} ${amount}${groupString ? ` ${groupString}` : ""}`;
}

// gear (clusters)
function enchantmentPassiveNode(enchantments: string[]): string {
  return `EnchantmentPassiveNode ${enchantments.map((entry) => `"${entry}"`).join(" ")}`;
}
function enchantmentPassiveNum(op: Operator, number: number | string): string {
  return `EnchantmentPassiveNum ${op} ${number}`;
}

// gear (weapons)
function crucibleTree(bool: boolean): string {
  return `HasCruciblePassiveTree ${bool}`;
}

// gear (armour)
function baseDefencePercentile(op: Operator, value: number | string): string {
  return `BaseDefencePercentile ${op} ${value}`;
}
function baseArmour(op: Operator, value: number | string): string {
  return `BaseArmour ${op} ${value}`;
}
function baseEnergyShield(op: Operator, value: number | string): string {
  return `BaseEnergyShield ${op} ${value}`;
}
function baseEvasion(op: Operator, value: number | string): string {
  return `BaseEvasion ${op} ${value}`;
}
function baseWard(op: Operator, value: number | string): string {
  return `BaseWard ${op} ${value}`;
}

// gear (influence)
function hasInfluence(influence: Influence[]): string {
  return `HasInfluence ${influence.map((entry) => `"${entry}"`).join(" ")}`;
}
function hasSearingExarchImplicit(
  op: Operator,
  amount: number | string,
): string {
  return `HasSearingExarchImplicit ${op} ${amount}`;
}
function hasEaterOfWorldsImplicit(
  op: Operator,
  amount: number | string,
): string {
  return `HasEaterOfWorldsImplicit ${op} ${amount}`;
}

// gear (synth)
function synthesised(bool: boolean): string {
  return `SynthesisedItem ${bool}`;
}

// gear (uniques)
function replica(bool: boolean): string {
  return `Replica ${bool}`;
}

// archhem
function archnemesisMod(modNames: string[]): string {
  return `ArchnemesisMod ${modNames.map((entry) => `"${entry}"`).join(" ")}`;
}

export function serializeConditions(conditions: Conditions) {
  const strs = [];

  if (conditions.bases) {
    strs.push(baseType(Operator.eq, conditions.bases));
  }

  if (conditions.classes) {
    strs.push(className(conditions.classes.operator, conditions.classes.value));
  }
  if (conditions.height) {
    strs.push(height(conditions.height.operator, conditions.height.value));
  }
  if (conditions.width) {
    strs.push(width(conditions.width.operator, conditions.width.value));
  }
  if (conditions.areaLevel) {
    strs.push(
      areaLevel(conditions.areaLevel.operator, conditions.areaLevel.value),
    );
  }
  if (conditions.dropLevel) {
    strs.push(
      dropLevel(conditions.dropLevel.operator, conditions.dropLevel.value),
    );
  }
  if (conditions.stackSize) {
    strs.push(
      stackSize(conditions.stackSize.operator, conditions.stackSize.value),
    );
  }
  if (conditions.quality) {
    strs.push(quality(conditions.quality.operator, conditions.quality.value));
  }
  if (conditions.gemLevel) {
    strs.push(
      gemLevel(conditions.gemLevel.operator, conditions.gemLevel.value),
    );
  }
  if (conditions.mapTier) {
    strs.push(mapTier(conditions.mapTier.operator, conditions.mapTier.value));
  }
  if (conditions.transfiguredGem) {
    strs.push(transfiguredGem(conditions.transfiguredGem.value));
  }
  if (conditions.elderMap) {
    strs.push(elderMap(conditions.elderMap.value));
  }
  if (conditions.shapedMap) {
    strs.push(shapedMap(conditions.shapedMap.value));
  }
  if (conditions.blightedMap) {
    strs.push(blightedMap(conditions.blightedMap.value));
  }
  if (conditions.uberBlightedMap) {
    strs.push(uberBlightedMap(conditions.uberBlightedMap.value));
  }
  if (conditions.hasImplicitMod) {
    strs.push(hasImplicitMod(conditions.hasImplicitMod.value));
  }
  if (conditions.identified) {
    strs.push(identified(conditions.identified.value));
  }
  if (conditions.scourged) {
    strs.push(scourged(conditions.scourged.value));
  }
  if (conditions.fractured) {
    strs.push(fractured(conditions.fractured.value));
  }
  if (conditions.mirrored) {
    strs.push(mirrored(conditions.mirrored.value));
  }
  if (conditions.corrupted) {
    strs.push(corrupted(conditions.corrupted.value));
  }
  if (conditions.synthesised) {
    strs.push(synthesised(conditions.synthesised.value));
  }
  if (conditions.replica) {
    strs.push(replica(conditions.replica.value));
  }
  if (conditions.crucibleTree) {
    strs.push(crucibleTree(conditions.crucibleTree.value));
  }
  if (conditions.itemLevel) {
    strs.push(
      itemLevel(conditions.itemLevel.operator, conditions.itemLevel.value),
    );
  }
  if (conditions.defencePercentile) {
    strs.push(
      baseDefencePercentile(
        conditions.defencePercentile.operator,
        conditions.defencePercentile.value,
      ),
    );
  }
  if (conditions.armour) {
    strs.push(baseArmour(conditions.armour.operator, conditions.armour.value));
  }
  if (conditions.evasion) {
    strs.push(
      baseEvasion(conditions.evasion.operator, conditions.evasion.value),
    );
  }
  if (conditions.energyShield) {
    strs.push(
      baseEnergyShield(
        conditions.energyShield.operator,
        conditions.energyShield.value,
      ),
    );
  }
  if (conditions.ward) {
    strs.push(baseWard(conditions.ward.operator, conditions.ward.value));
  }
  if (conditions.corruptedMods) {
    strs.push(
      corruptedMods(
        conditions.corruptedMods.operator,
        conditions.corruptedMods.value,
      ),
    );
  }
  if (conditions.rarity) {
    const condition = rarity(Operator.eq, conditions.rarity.value);
    if (condition) {
      strs.push(condition);
    }
  }
  if (conditions.hasExplicitMod) {
    strs.push(hasExplicitMod(conditions.hasExplicitMod.value));
  }
  if (conditions.hasEnchantment) {
    strs.push(hasEnchantment(conditions.hasEnchantment.value));
  }
  if (conditions.archnemesisMod) {
    strs.push(archnemesisMod(conditions.archnemesisMod.value));
  }
  if (conditions.enchantmentPassiveNode) {
    strs.push(enchantmentPassiveNode(conditions.enchantmentPassiveNode.value));
  }
  if (conditions.enchantmentPassiveNum) {
    strs.push(
      enchantmentPassiveNum(
        conditions.enchantmentPassiveNum.operator,
        conditions.enchantmentPassiveNum.value,
      ),
    );
  }
  if (conditions.hasSearingExarchImplicit) {
    strs.push(
      hasSearingExarchImplicit(
        conditions.hasSearingExarchImplicit.operator,
        conditions.hasSearingExarchImplicit.value,
      ),
    );
  }
  if (conditions.hasEaterOfWorldsImplicit) {
    strs.push(
      hasEaterOfWorldsImplicit(
        conditions.hasEaterOfWorldsImplicit.operator,
        conditions.hasEaterOfWorldsImplicit.value,
      ),
    );
  }
  if (conditions.hasInfluence) {
    strs.push(hasInfluence(conditions.hasInfluence.value));
  }
  if (conditions.sockets) {
    strs.push(sockets(conditions.sockets.operator, conditions.sockets.value));
  }

  return strs;
}
