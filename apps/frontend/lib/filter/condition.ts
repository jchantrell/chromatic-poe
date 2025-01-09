import type { FilterItem } from "./filter";
import { itemIndex } from "./items";

type ListCondition<T> = {
  value: T[];
};

type OpListCondition<T> = {
  operator: Operator;
  value: T[];
};

type OpValueCondition<T> = {
  operator?: Operator;
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
  EXACT = "==",
  EQ = "=",
  NEQ = "!",
  NEQ2 = "!=",
  LT = "<",
  LTE = "<=",
  GT = ">",
  GTE = ">=",
}

export enum Rarity {
  NORMAL = "Normal",
  MAGIC = "Magic",
  RARE = "Rare",
  UNIQUE = "Unique",
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

export function hasEnabledWithAttribute(
  items: FilterItem[],
  key: keyof FilterItem,
  value: string,
): boolean {
  return items.some((item) => item.enabled && item[key] === value);
}

export function hasEnabledWithoutAttribute(
  items: FilterItem[],
  key: keyof FilterItem,
  value: string,
): boolean {
  return items.some((item) => item.enabled && item[key] !== value);
}

// internal
function baseType(op: Operator, bases: string[]): string {
  return `BaseType ${op} ${bases.map((e) => `"${e}"`).join(" ")}`;
}
function className(op: Operator, classNames: string[]): string | null {
  if (!classNames.length) return null;
  return `Class ${op} ${classNames.map((entry) => `"${entry}"`).join(" ")}`;
}

// general
function height(op: Operator | undefined, height: number | string): string {
  return `Height ${op ? `${op} ` : ""}${height}`;
}
function width(op: Operator | undefined, width: number | string): string {
  return `Width ${op ? `${op} ` : ""}${width}`;
}
function areaLevel(op: Operator | undefined, lvl: number | string): string {
  return `AreaLevel ${op ? `${op} ` : ""}${lvl}`;
}
function dropLevel(op: Operator | undefined, lvl: number | string): string {
  return `DropLevel ${op ? `${op} ` : ""}${lvl}`;
}

// stackables
function stackSize(op: Operator | undefined, size: number | string): string {
  return `StackSize ${op ? `${op} ` : ""}${size}`;
}

// quality (gear, gems, maps)
function quality(op: Operator | undefined, qual: number | string): string {
  return `Quality ${op ? `${op} ` : ""}${qual}`;
}

// gems
function gemLevel(op: Operator | undefined, lvl: number | string): string {
  return `GemLevel ${op ? `${op} ` : ""}${lvl}`;
}
function alternateQuality(bool: boolean): string {
  return `AlternateQuality ${bool}`;
}
function transfiguredGem(bool: boolean): string {
  return `TransfiguredGem "${bool}"`;
}

// maps
function mapTier(op: Operator | undefined, tier: number | string): string {
  return `WaystoneTier ${op ? `${op} ` : ""}${tier}`; // FIXME: poe1 support
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
function itemLevel(op: Operator | undefined, lvl: number | string): string {
  return `ItemLevel ${op ? `${op} ` : ""}${lvl}`;
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
function corruptedMods(
  op: Operator | undefined,
  number: number | string,
): string {
  return `CorruptedMods ${op ? `${op} ` : ""}${number}`;
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
  op: Operator | undefined,
  amount: number | string,
  groupString?: string,
): string {
  return `Sockets ${op ? `${op} ` : ""}${amount}${groupString ? ` ${groupString}` : ""}`;
}

// gear (clusters)
function enchantmentPassiveNode(enchantments: string[]): string {
  return `EnchantmentPassiveNode ${enchantments.map((entry) => `"${entry}"`).join(" ")}`;
}
function enchantmentPassiveNum(
  op: Operator | undefined,
  number: number | string,
): string {
  return `EnchantmentPassiveNum ${op ? `${op} ` : ""}${number}`;
}

// gear (weapons)
function crucibleTree(bool: boolean): string {
  return `HasCruciblePassiveTree ${bool}`;
}

// gear (armour)
function baseDefencePercentile(
  op: Operator | undefined,
  value: number | string,
): string {
  return `BaseDefencePercentile ${op ? `${op} ` : ""}${value}`;
}
function baseArmour(op: Operator | undefined, value: number | string): string {
  return `BaseArmour ${op ? `${op} ` : ""}${value}`;
}
function baseEnergyShield(
  op: Operator | undefined,
  value: number | string,
): string {
  return `BaseEnergyShield ${op ? `${op} ` : ""}${value}`;
}
function baseEvasion(op: Operator | undefined, value: number | string): string {
  return `BaseEvasion ${op ? `${op} ` : ""}${value}`;
}
function baseWard(op: Operator | undefined, value: number | string): string {
  return `BaseWard ${op ? `${op} ` : ""}${value}`;
}

// gear (influence)
function hasInfluence(influence: Influence[]): string {
  return `HasInfluence ${influence.map((entry) => `"${entry}"`).join(" ")}`;
}
function hasSearingExarchImplicit(
  op: Operator | undefined,
  amount: number | string,
): string {
  return `HasSearingExarchImplicit ${op ? `${op} ` : ""}${amount}`;
}
function hasEaterOfWorldsImplicit(
  op: Operator | undefined,
  amount: number | string,
): string {
  return `HasEaterOfWorldsImplicit ${op ? `${op} ` : ""}${amount}`;
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
    strs.push(baseType(Operator.EXACT, conditions.bases));
  }

  if (conditions.classes) {
    const condition = className(Operator.EXACT, conditions.classes.value);
    if (condition) {
      strs.push(condition);
    }
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
  if (conditions.sockets) {
    strs.push(sockets(conditions.sockets.operator, conditions.sockets.value));
  }
  if (conditions.rarity) {
    const condition = rarity(Operator.EXACT, conditions.rarity.value);
    if (condition) {
      strs.push(condition);
    }
  }
  if (conditions.hasExplicitMod) {
    strs.push(hasExplicitMod(conditions.hasExplicitMod.value));
  }
  if (conditions.enchanted) {
    strs.push(anyEnchantment(conditions.enchanted.value));
  }
  if (conditions.archnemesisMod) {
    strs.push(archnemesisMod(conditions.archnemesisMod.value));
  }
  if (conditions.enchantmentPassiveNode) {
    strs.push(enchantmentPassiveNode(conditions.enchantmentPassiveNode.value));
  }
  if (conditions.hasInfluence) {
    strs.push(hasInfluence(conditions.hasInfluence.value));
  }

  return strs;
}

export const conditionTypes: Partial<
  Record<
    keyof Conditions,
    {
      label: string;
      type: string;
      group: string;
      operators: boolean;
      defaultValue: Conditions[keyof Conditions]["value"];
      min?: number;
      max?: number;
      options?: string[];
    }
  >
> = {
  classes: {
    label: "Class",
    type: "toggle",
    group: "General",
    operators: false,
    defaultValue: [],
    options: itemIndex.classes,
  },
  height: {
    label: "Height",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 4,
  },
  width: {
    label: "Width",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 4,
  },

  areaLevel: {
    label: "Area Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  dropLevel: {
    label: "Drop Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  itemLevel: {
    label: "Item Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  quality: {
    label: "Quality",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 100,
  },

  stackSize: {
    label: "Stack Size",
    type: "slider",
    group: "Currency",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 50000,
  },

  gemLevel: {
    label: "Gem Level",
    type: "slider",
    group: "Gems",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 21,
  },
  // transfiguredGem: {
  //   label: "Transfigured Gem",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  mapTier: {
    label: "Map Tier",
    type: "slider",
    group: "Maps",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 17,
  },
  // elderMap: {
  //   label: "Elder Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // shapedMap: {
  //   label: "Shaped Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // blightedMap: {
  //   label: "Blighted Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // uberBlightedMap: {
  //   label: "Uber Blighted Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  hasImplicitMod: {
    label: "Has Implicit Mod",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  rarity: {
    label: "Rarity",
    type: "toggle",
    group: "General",
    operators: false,
    defaultValue: [],
    options: Object.values(Rarity),
  },
  identified: {
    label: "Identified",
    type: "checkbox",
    group: "General",
    operators: false,
    defaultValue: false,
  },
  // scourged: {
  //   label: "Scourged",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // fractured: {
  //   label: "Fractured",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  mirrored: {
    label: "Mirrored",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  corrupted: {
    label: "Corrupted",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  enchanted: {
    label: "Enchanted",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  // synthesised: {
  //   label: "Synthesised",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // replica: {
  //   label: "Replica",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // crucibleTree: {
  //   label: "Has Crucible Tree",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  // Mods and enchantments
  // corruptedMods: {
  //   label: "Corrupted Mods",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasExplicitMod: {
  //   label: "Explicit Mods",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // hasEnchantment: {
  //   label: "Enchantments",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // archnemesisMod: {
  //   label: "Archnemesis Mods",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },

  // // Cluster jewel specific
  // enchantmentPassiveNode: {
  //   label: "Passive Node",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // enchantmentPassiveNum: {
  //   label: "slider of Passives",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 1,
  //   min: 1,
  // },

  // Influence
  // hasSearingExarchImplicit: {
  //   label: "Searing Exarch Implicit",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasEaterOfWorldsImplicit: {
  //   label: "Eater of Worlds Implicit",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasInfluence: {
  //   label: "Influence",
  //   type: "toggle",
  //   operators: false,
  //   defaultValue: [],
  //   options: Object.values(Influence),
  // },

  // linkedSockets: {
  //   label: "Linked Sockets",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  //   max: 6,
  // },
  sockets: {
    label: "Sockets",
    type: "slider",
    group: "Gear",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 3,
  },
  // socketGroup: {
  //   label: "Socket Group",
  //   type: "text",
  //   operators: true,
  //   defaultValue: "",
  // },

  // Defense stats
  // defencePercentile: {
  //   label: "Defence Percentile",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  //   max: 100,
  // },
  armour: {
    label: "Armour",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  evasion: {
    label: "Evasion",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    max: 5000,
    min: 0,
  },
  energyShield: {
    label: "Energy Shield",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  ward: {
    label: "Ward",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
};
