import { createMutable } from "solid-js/store";
import { itemIndex } from "./items";

export enum ConditionType {
  VALUE = "value",
  LIST = "list",
  BOOL = "bool",
}

interface Condition<T> {
  type: ConditionType;
  key: ConditionKey;
  value: T;
  operator?: Operator;
  serialize(): string;
}

interface ValueCondition<T> extends Condition<T> {
  type: ConditionType.VALUE;
  operator: Operator;
  value: T;
}

interface ListCondition<T> extends Condition<T[]> {
  type: ConditionType.LIST;
  value: T[];
}

interface BoolCondition extends Condition<boolean> {
  type: ConditionType.BOOL;
  value: boolean;
}

export enum Operator {
  NONE = "",
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

export enum ConditionKey {
  BASE_TYPE = "baseType",
  HEIGHT = "height",
  WIDTH = "width",
  ITEM_LEVEL = "itemLevel",
  QUALITY = "quality",
  GEM_LEVEL = "gemLevel",
  MAP_TIER = "mapTier",
  CORRUPTED_MODS = "corruptedMods",
  AREA_LEVEL = "areaLevel",
  DROP_LEVEL = "dropLevel",
  STACK_SIZE = "stackSize",
  SEARING_EXARCH_IMPLICIT = "hasSearingExarchImplicit",
  EATER_IMPLICIT = "hasEaterOfWorldsImplicit",
  BASE_DEFENCE_PERCENTILE = "baseDefencePercentile",
  BASE_ARMOUR = "baseArmour",
  BASE_EVASION = "baseEvasion",
  BASE_ENERGY_SHIELD = "baseEnergyShield",
  BASE_WARD = "baseWard",
  LINKED_SOCKETS = "linkedSockets",
  SOCKETS = "sockets",
  SOCKET_GROUP = "socketGroup",
  CLASSES = "classes",
  ENCHANTMENT_PASSIVE_NUM = "enchantmentPassiveNum",
  ENCHANTMENT_PASSIVE_NODE = "enchantmentPassiveNode",
  RARITY = "rarity",
  INFLUENCE = "hasInfluence",
  EXPLICIT_MOD = "hasExplicitMod",
  ENCHANTMENT = "hasEnchantment",
  ARCHNEMESIS_MOD = "archnemesisMod",
  TRANSFIGURED_GEM = "transfiguredGem",
  ELDER_MAP = "elderMap",
  SHAPED_MAP = "shapedMap",
  BLIGHTED_MAP = "blightedMap",
  UBER_BLIGHTED_MAP = "uberBlightedMap",
  HAS_IMPLICIT_MOD = "hasImplicitMod",
  IDENTIFIED = "identified",
  SCOURGED = "scourged",
  FRACTURED = "fracturedItem",
  MIRRORED = "mirrored",
  CORRUPTED = "corrupted",
  ANY_ENCHANTMENT = "anyEnchantment",
  SYNTHESISED = "synthesisedItem",
  REPLICA = "replica",
  CRUCIBLE_TREE = "hasCruciblePassiveTree",
}

export enum ConditionGroup {
  UNUSED = "Unused",
  GENERAL = "General",
  GEAR = "Gear",
  GEMS = "Gems",
  MAPS = "Maps",
  ARMOUR = "Armour",
  SOCKETS = "Sockets",
  MODS = "Mods",
  CLUSTERS = "Clusters",
}

export const conditionGroupColors = {
  [ConditionGroup.GENERAL]: "text-blue-500",
  [ConditionGroup.GEAR]: "text-green-500",
  [ConditionGroup.GEMS]: "text-yellow-500",
  [ConditionGroup.MAPS]: "text-purple-500",
  [ConditionGroup.ARMOUR]: "text-red-500",
  [ConditionGroup.SOCKETS]: "text-pink-500",
  [ConditionGroup.MODS]: "text-orange-500",
  [ConditionGroup.CLUSTERS]: "text-teal-500",
} as const;

export enum ConditionInputType {
  SLIDER = "slider",
  SELECT = "select",
  TEXT = "text",
  TEXT_LIST = "text-list",
  CHECKBOX = "checkbox",
}

type BaseConditionValue = {
  label: string;
  description: string;
  group: ConditionGroup;
};

export interface ConditionData {
  [ConditionKey.BASE_TYPE]: string[];
  [ConditionKey.HEIGHT]: number;
  [ConditionKey.WIDTH]: number;
  [ConditionKey.ITEM_LEVEL]: number;
  [ConditionKey.QUALITY]: number;
  [ConditionKey.GEM_LEVEL]: number;
  [ConditionKey.MAP_TIER]: number;
  [ConditionKey.CORRUPTED_MODS]: number;
  [ConditionKey.AREA_LEVEL]: number;
  [ConditionKey.DROP_LEVEL]: number;
  [ConditionKey.STACK_SIZE]: number;
  [ConditionKey.SEARING_EXARCH_IMPLICIT]: number;
  [ConditionKey.EATER_IMPLICIT]: number;
  [ConditionKey.BASE_DEFENCE_PERCENTILE]: number;
  [ConditionKey.BASE_ARMOUR]: number;
  [ConditionKey.BASE_EVASION]: number;
  [ConditionKey.BASE_ENERGY_SHIELD]: number;
  [ConditionKey.BASE_WARD]: number;
  [ConditionKey.LINKED_SOCKETS]: number;
  [ConditionKey.SOCKETS]: number;
  [ConditionKey.SOCKET_GROUP]: string;
  [ConditionKey.CLASSES]: string[];
  [ConditionKey.ENCHANTMENT_PASSIVE_NUM]: number;
  [ConditionKey.ENCHANTMENT_PASSIVE_NODE]: string[];
  [ConditionKey.RARITY]: Rarity[];
  [ConditionKey.INFLUENCE]: Influence[];
  [ConditionKey.EXPLICIT_MOD]: string[];
  [ConditionKey.ENCHANTMENT]: string[];
  [ConditionKey.ARCHNEMESIS_MOD]: string[];
  [ConditionKey.TRANSFIGURED_GEM]: boolean;
  [ConditionKey.ELDER_MAP]: boolean;
  [ConditionKey.SHAPED_MAP]: boolean;
  [ConditionKey.BLIGHTED_MAP]: boolean;
  [ConditionKey.UBER_BLIGHTED_MAP]: boolean;
  [ConditionKey.HAS_IMPLICIT_MOD]: boolean;
  [ConditionKey.IDENTIFIED]: boolean;
  [ConditionKey.SCOURGED]: boolean;
  [ConditionKey.FRACTURED]: boolean;
  [ConditionKey.MIRRORED]: boolean;
  [ConditionKey.CORRUPTED]: boolean;
  [ConditionKey.ANY_ENCHANTMENT]: boolean;
  [ConditionKey.SYNTHESISED]: boolean;
  [ConditionKey.REPLICA]: boolean;
  [ConditionKey.CRUCIBLE_TREE]: boolean;
}

type ConditionValues<K extends ConditionKey> = BaseConditionValue & {
  type: ConditionInputType;
  defaultValue: ConditionData[K];
  min?: number;
  max?: number;
  options?: string[];
};

type AllConditionTypes = {
  [key in ConditionKey]: ConditionValues<key>;
};

export const conditionTypes: AllConditionTypes = {
  [ConditionKey.BASE_TYPE]: {
    label: "Bases",
    description: "A list of item bases",
    group: ConditionGroup.UNUSED,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
  },
  [ConditionKey.HEIGHT]: {
    label: "Height",
    description: "The height of the item in inventory slots",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 4,
  },
  [ConditionKey.WIDTH]: {
    label: "Width",
    description: "The width of the item in inventory slots",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 4,
  },
  [ConditionKey.ITEM_LEVEL]: {
    label: "Item Level",
    description: "The item level of the item (hold alt to see in game)",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  [ConditionKey.QUALITY]: {
    label: "Quality",
    description: "The quality of the item (gear, flasks, etc)",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 100,
  },
  [ConditionKey.CLASSES]: {
    label: "Class",
    description: "The internal class of the item",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
    options: itemIndex.classes,
  },
  [ConditionKey.RARITY]: {
    label: "Rarity",
    description: "Normal, Magic, Rare and Unique",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
    options: Object.values(Rarity),
  },
  [ConditionKey.IDENTIFIED]: {
    label: "Identified",
    description: "Whether the item is identified",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.CORRUPTED]: {
    label: "Corrupted",
    description: "Whether the item is corrupted",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.STACK_SIZE]: {
    label: "Stack Size",
    description: "The number of items in the stack",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 50000,
  },
  [ConditionKey.GEM_LEVEL]: {
    label: "Gem Level",
    description: "The level of the gem",
    group: ConditionGroup.GEMS,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 21,
  },
  [ConditionKey.MAP_TIER]: {
    label: "Map Tier",
    description: "The tier of the map",
    group: ConditionGroup.MAPS,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 17,
  },
  [ConditionKey.DROP_LEVEL]: {
    label: "Drop Level",
    description: "The level the item starts dropping at",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  [ConditionKey.AREA_LEVEL]: {
    label: "Area Level",
    description: "The level of the area the item is dropped in",
    group: ConditionGroup.GENERAL,
    type: ConditionInputType.SLIDER,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  [ConditionKey.ELDER_MAP]: {
    label: "Elder Map",
    description: "Whether the item is an elder map",
    group: ConditionGroup.MAPS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.SHAPED_MAP]: {
    label: "Shaped Map",
    description: "Whether the item is a shaped map",
    group: ConditionGroup.MAPS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.BLIGHTED_MAP]: {
    label: "Blighted Map",
    description: "Whether the item is a blighted map",
    group: ConditionGroup.MAPS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.UBER_BLIGHTED_MAP]: {
    label: "Uber Blighted Map",
    description: "Whether the item is an uber blighted map",
    group: ConditionGroup.MAPS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.BASE_DEFENCE_PERCENTILE]: {
    label: "Defence Percentile",
    description: "The item's defence percentile",
    group: ConditionGroup.ARMOUR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 100,
  },
  [ConditionKey.BASE_ARMOUR]: {
    label: "Armour",
    description: "The item's armour",
    group: ConditionGroup.ARMOUR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  [ConditionKey.BASE_EVASION]: {
    label: "Evasion",
    description: "The item's evasion",
    group: ConditionGroup.ARMOUR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  [ConditionKey.BASE_ENERGY_SHIELD]: {
    label: "Energy Shield",
    description: "The item's energy shield",
    group: ConditionGroup.ARMOUR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  [ConditionKey.BASE_WARD]: {
    label: "Ward",
    description: "The item's ward",
    group: ConditionGroup.ARMOUR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  [ConditionKey.INFLUENCE]: {
    label: "Influence",
    description: "The influences the item has (Shaper, Elder, Crusader, etc)",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
    options: Object.values(Influence),
  },
  [ConditionKey.SEARING_EXARCH_IMPLICIT]: {
    label: "Searing Exarch Implicits",
    description: "The amount of Searing Exarch Implicits the item has",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 4,
  },
  [ConditionKey.EATER_IMPLICIT]: {
    label: "Eater of Worlds Implicits",
    description: "The amount of Eater of Worlds Implicits the item has",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 4,
  },
  [ConditionKey.LINKED_SOCKETS]: {
    label: "Linked Sockets",
    description: "The amount of linked sockets the item has",
    group: ConditionGroup.SOCKETS,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 6,
  },
  [ConditionKey.SOCKETS]: {
    label: "Sockets",
    description: "The amount of sockets the item has",
    group: ConditionGroup.SOCKETS,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 6,
  },
  [ConditionKey.SOCKET_GROUP]: {
    label: "Socket Group",
    description: "The group of sockets the item has (RGBA)",
    group: ConditionGroup.SOCKETS,
    type: ConditionInputType.TEXT,
    defaultValue: "",
  },
  [ConditionKey.EXPLICIT_MOD]: {
    label: "Explicit Mods",
    description:
      "A list of explicit mods the item has (e.g. Tyrannical, Flaring, Tempered)",
    group: ConditionGroup.MODS,
    type: ConditionInputType.SELECT,
    defaultValue: [],
  },
  [ConditionKey.HAS_IMPLICIT_MOD]: {
    label: "Has Implicit Mod",
    description: "Whether the item has an implicit mod",
    group: ConditionGroup.MODS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.ENCHANTMENT]: {
    label: "Enchantments",
    description: `A list of enchantments the item has (e.g. "Enchantment Bane Damage 2")`,
    group: ConditionGroup.MODS,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
  },
  [ConditionKey.ANY_ENCHANTMENT]: {
    label: "Enchanted",
    description: "Whether the item has any enchantments",
    group: ConditionGroup.MODS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.SYNTHESISED]: {
    label: "Synthesised",
    description: "Whether the item is synthesised",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.REPLICA]: {
    label: "Replica",
    description: "Whether the item is a replica unique",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.MIRRORED]: {
    label: "Mirrored",
    description: "Whether the item is mirrored",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.FRACTURED]: {
    label: "Fractured",
    description: "Whether the item is fractured",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.SCOURGED]: {
    label: "Scourged",
    description: "Whether the item is scourged",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.CRUCIBLE_TREE]: {
    label: "Crucible Tree",
    description: "Whether the item has a Crucible Tree",
    group: ConditionGroup.GEAR,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.ARCHNEMESIS_MOD]: {
    label: "Archnemesis Mods",
    description: "A list of Archnemesis mods the item has (e.g. 'Toxic')",
    group: ConditionGroup.MODS,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
  },
  [ConditionKey.TRANSFIGURED_GEM]: {
    label: "Transfigured Gem",
    description: "Whether the item is a transfigured gem",
    group: ConditionGroup.GEMS,
    type: ConditionInputType.CHECKBOX,
    defaultValue: false,
  },
  [ConditionKey.CORRUPTED_MODS]: {
    label: "Corrupted Mods",
    description: "The amount of corrupted mods the item has",
    group: ConditionGroup.MODS,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 10,
  },
  [ConditionKey.ENCHANTMENT_PASSIVE_NODE]: {
    label: "Enchantment Passive Nodes",
    description: `A list of Enchantment Passive Nodes the item has (e.g. "Damage over Time")`,
    group: ConditionGroup.CLUSTERS,
    type: ConditionInputType.TEXT_LIST,
    defaultValue: [],
    options: [],
  },
  [ConditionKey.ENCHANTMENT_PASSIVE_NUM]: {
    label: "Enchantment Passive Count",
    description:
      "The amount of Enchantment Passive Nodes the item has (e.g. 12 passive cluster)",
    group: ConditionGroup.CLUSTERS,
    type: ConditionInputType.SLIDER,
    defaultValue: 0,
    min: 0,
    max: 12,
  },
};

class HeightCondition implements ValueCondition<number> {
  readonly key = ConditionKey.HEIGHT;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Height ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}
class WidthCondition implements ValueCondition<number> {
  readonly key = ConditionKey.WIDTH;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Width ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}
class ItemLevelCondition implements ValueCondition<number> {
  readonly key = ConditionKey.ITEM_LEVEL;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `ItemLevel ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class QualityCondition implements ValueCondition<number> {
  readonly key = ConditionKey.QUALITY;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Quality ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class GemLevelCondition implements ValueCondition<number> {
  readonly key = ConditionKey.GEM_LEVEL;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `GemLevel ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class MapTierCondition implements ValueCondition<number> {
  readonly key = ConditionKey.MAP_TIER;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `WaystoneTier ${this.operator} ${this.value}`;
  }
}

class AreaLevelCondition implements ValueCondition<number> {
  readonly key = ConditionKey.AREA_LEVEL;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `AreaLevel ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class DropLevelCondition implements ValueCondition<number> {
  readonly key = ConditionKey.DROP_LEVEL;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `DropLevel ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class CorruptedModsCondition implements ValueCondition<number> {
  readonly key = ConditionKey.CORRUPTED_MODS;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.NONE;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `CorruptedMods ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

export class BaseTypeCondition implements ListCondition<string> {
  readonly key = ConditionKey.BASE_TYPE;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts: { value: string[] }) {
    this.value = opts.value;
    createMutable(this);
  }

  serialize(): string {
    if (!this.value.length) return "";
    return `BaseType ${Operator.EXACT} ${this.value.map((v) => `"${v}"`).join(" ")}`;
  }
}

export class ClassesCondition implements ListCondition<string> {
  readonly key = ConditionKey.CLASSES;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts?: { value?: string[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    if (!this.value.length) return "";
    return `Class ${Operator.EXACT} ${this.value.map((v) => `"${v}"`).join(" ")}`;
  }
}

export class RarityCondition implements ListCondition<Rarity> {
  readonly key = ConditionKey.RARITY;
  readonly type = ConditionType.LIST;
  value: Rarity[];
  constructor(opts?: { value?: Rarity[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    if (!this.value.length) return "";
    return `Rarity ${Operator.EXACT} ${this.value.map((v) => `"${v}"`).join(" ")}`;
  }
}

class IdentifiedCondition implements BoolCondition {
  readonly key = ConditionKey.IDENTIFIED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Identified ${this.value}`;
  }
}

class CorruptedCondition implements BoolCondition {
  readonly key = ConditionKey.CORRUPTED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Corrupted ${this.value}`;
  }
}

class StackSizeCondition implements ValueCondition<number> {
  readonly key = ConditionKey.STACK_SIZE;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `StackSize ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class SearingExarchImplicitCondition implements ValueCondition<number> {
  readonly key = ConditionKey.SEARING_EXARCH_IMPLICIT;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasSearingExarchImplicit ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class EaterImplicitCondition implements ValueCondition<number> {
  readonly key = ConditionKey.EATER_IMPLICIT;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasEaterOfWorldsImplicit ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class BaseDefencePercentileCondition implements ValueCondition<number> {
  readonly key = ConditionKey.BASE_DEFENCE_PERCENTILE;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BaseDefencePercentile ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class BaseArmourCondition implements ValueCondition<number> {
  readonly key = ConditionKey.BASE_ARMOUR;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BaseArmour ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class BaseEvasionCondition implements ValueCondition<number> {
  readonly key = ConditionKey.BASE_EVASION;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BaseEvasion ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class BaseEnergyShieldCondition implements ValueCondition<number> {
  readonly key = ConditionKey.BASE_ENERGY_SHIELD;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BaseEnergyShield ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class BaseWardCondition implements ValueCondition<number> {
  readonly key = ConditionKey.BASE_WARD;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BaseWard ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class EnchantmentPassiveNumCondition implements ValueCondition<number> {
  readonly key = ConditionKey.ENCHANTMENT_PASSIVE_NUM;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `EnchantmentPassiveNum ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class EnchantmentPassiveNodeCondition implements ListCondition<string> {
  readonly key = ConditionKey.ENCHANTMENT_PASSIVE_NODE;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts?: { value?: string[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `EnchantmentPassiveNode ${this.value.map((entry) => `"${entry}"`).join(" ")}`;
  }
}

class InfluenceCondition implements ListCondition<Influence> {
  readonly key = ConditionKey.INFLUENCE;
  readonly type = ConditionType.LIST;
  value: Influence[];
  constructor(opts?: { value?: Influence[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasInfluence ${this.value.map((entry) => `"${entry}"`).join(" ")}`;
  }
}

class ExplicitModCondition implements ListCondition<string> {
  readonly key = ConditionKey.EXPLICIT_MOD;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts?: { value?: string[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    if (!this.value.length) return "";
    return `HasExplicitMod ${this.value.map((entry) => `"${entry}"`).join(" ")}`;
  }
}

class EnchantmentCondition implements ListCondition<string> {
  readonly key = ConditionKey.ENCHANTMENT;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts?: { value?: string[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasEnchantment ${this.value.map((entry) => `"${entry}"`).join(" ")}`;
  }
}

class ArchnemesisModCondition implements ListCondition<string> {
  readonly key = ConditionKey.ARCHNEMESIS_MOD;
  readonly type = ConditionType.LIST;
  value: string[];
  constructor(opts?: { value?: string[] }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `ArchnemesisMod ${this.value.map((entry) => `"${entry}"`).join(" ")}`;
  }
}

class TransfiguredGemCondition implements BoolCondition {
  readonly key = ConditionKey.TRANSFIGURED_GEM;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `TransfiguredGem "${this.value}"`;
  }
}

class ElderMapCondition implements BoolCondition {
  readonly key = ConditionKey.ELDER_MAP;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `ElderMap ${this.value}`;
  }
}

class ShapedMapCondition implements BoolCondition {
  readonly key = ConditionKey.SHAPED_MAP;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `ShapedMap ${this.value}`;
  }
}

class BlightedMapCondition implements BoolCondition {
  readonly key = ConditionKey.BLIGHTED_MAP;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `BlightedMap ${this.value}`;
  }
}

class UberBlightedMapCondition implements BoolCondition {
  readonly key = ConditionKey.UBER_BLIGHTED_MAP;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `UberBlightedMap "${this.value}"`;
  }
}

class HasImplicitModCondition implements BoolCondition {
  readonly key = ConditionKey.HAS_IMPLICIT_MOD;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasImplicitMod ${this.value}`;
  }
}

class ScourgedCondition implements BoolCondition {
  readonly key = ConditionKey.SCOURGED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Scourged ${this.value}`;
  }
}

class FracturedCondition implements BoolCondition {
  readonly key = ConditionKey.FRACTURED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `FracturedItem ${this.value}`;
  }
}

class MirroredCondition implements BoolCondition {
  readonly key = ConditionKey.MIRRORED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Mirrored ${this.value}`;
  }
}

class AnyEnchantmentCondition implements BoolCondition {
  readonly key = ConditionKey.ANY_ENCHANTMENT;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `AnyEnchantment ${this.value}`;
  }
}

class SynthesisedCondition implements BoolCondition {
  readonly key = ConditionKey.SYNTHESISED;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `SynthesisedItem ${this.value}`;
  }
}

class ReplicaCondition implements BoolCondition {
  readonly key = ConditionKey.REPLICA;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Replica ${this.value}`;
  }
}

class CrucibleTreeCondition implements BoolCondition {
  readonly key = ConditionKey.CRUCIBLE_TREE;
  readonly type = ConditionType.BOOL;
  value: boolean;
  constructor(opts?: { value?: boolean }) {
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `HasCruciblePassiveTree ${this.value}`;
  }
}

class LinkedSocketsCondition implements ValueCondition<number> {
  readonly key = ConditionKey.LINKED_SOCKETS;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `LinkedSockets ${this.operator} ${this.value}`;
  }
}

class SocketsCondition implements ValueCondition<number> {
  readonly key = ConditionKey.SOCKETS;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: number;
  constructor(opts?: { operator?: Operator; value?: number }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `Sockets ${this.operator ? `${this.operator} ` : ""}${this.value}`;
  }
}

class SocketGroupCondition implements ValueCondition<string> {
  readonly key = ConditionKey.SOCKET_GROUP;
  readonly type = ConditionType.VALUE;
  operator: Operator;
  value: string;
  constructor(opts?: { operator?: Operator; value?: string }) {
    this.operator = opts?.operator ?? Operator.EXACT;
    this.value = opts?.value ?? conditionTypes[this.key].defaultValue;
    createMutable(this);
  }

  serialize(): string {
    return `SocketGroup ${this.operator} ${this.value}`;
  }
}

const verifyConstructors = <
  T extends {
    [K in keyof T]: new (
      ...args: ConstructorParameters<T[K]>
    ) => { key: K };
  },
>(
  x: T,
) => x;

const conditionConstructors = verifyConstructors({
  [ConditionKey.HEIGHT]: HeightCondition,
  [ConditionKey.WIDTH]: WidthCondition,
  [ConditionKey.ITEM_LEVEL]: ItemLevelCondition,
  [ConditionKey.QUALITY]: QualityCondition,
  [ConditionKey.GEM_LEVEL]: GemLevelCondition,
  [ConditionKey.MAP_TIER]: MapTierCondition,
  [ConditionKey.AREA_LEVEL]: AreaLevelCondition,
  [ConditionKey.DROP_LEVEL]: DropLevelCondition,
  [ConditionKey.STACK_SIZE]: StackSizeCondition,
  [ConditionKey.SEARING_EXARCH_IMPLICIT]: SearingExarchImplicitCondition,
  [ConditionKey.EATER_IMPLICIT]: EaterImplicitCondition,
  [ConditionKey.BASE_DEFENCE_PERCENTILE]: BaseDefencePercentileCondition,
  [ConditionKey.BASE_ARMOUR]: BaseArmourCondition,
  [ConditionKey.BASE_EVASION]: BaseEvasionCondition,
  [ConditionKey.BASE_ENERGY_SHIELD]: BaseEnergyShieldCondition,
  [ConditionKey.BASE_WARD]: BaseWardCondition,
  [ConditionKey.BASE_TYPE]: BaseTypeCondition,
  [ConditionKey.SOCKET_GROUP]: SocketGroupCondition,
  [ConditionKey.ENCHANTMENT_PASSIVE_NODE]: EnchantmentPassiveNodeCondition,
  [ConditionKey.ENCHANTMENT_PASSIVE_NUM]: EnchantmentPassiveNumCondition,
  [ConditionKey.RARITY]: RarityCondition,
  [ConditionKey.INFLUENCE]: InfluenceCondition,
  [ConditionKey.EXPLICIT_MOD]: ExplicitModCondition,
  [ConditionKey.ENCHANTMENT]: EnchantmentCondition,
  [ConditionKey.ARCHNEMESIS_MOD]: ArchnemesisModCondition,
  [ConditionKey.TRANSFIGURED_GEM]: TransfiguredGemCondition,
  [ConditionKey.ELDER_MAP]: ElderMapCondition,
  [ConditionKey.SHAPED_MAP]: ShapedMapCondition,
  [ConditionKey.BLIGHTED_MAP]: BlightedMapCondition,
  [ConditionKey.UBER_BLIGHTED_MAP]: UberBlightedMapCondition,
  [ConditionKey.HAS_IMPLICIT_MOD]: HasImplicitModCondition,
  [ConditionKey.IDENTIFIED]: IdentifiedCondition,
  [ConditionKey.SCOURGED]: ScourgedCondition,
  [ConditionKey.FRACTURED]: FracturedCondition,
  [ConditionKey.MIRRORED]: MirroredCondition,
  [ConditionKey.CORRUPTED]: CorruptedCondition,
  [ConditionKey.ANY_ENCHANTMENT]: AnyEnchantmentCondition,
  [ConditionKey.SYNTHESISED]: SynthesisedCondition,
  [ConditionKey.REPLICA]: ReplicaCondition,
  [ConditionKey.CRUCIBLE_TREE]: CrucibleTreeCondition,
  [ConditionKey.LINKED_SOCKETS]: LinkedSocketsCondition,
  [ConditionKey.SOCKETS]: SocketsCondition,
  [ConditionKey.CLASSES]: ClassesCondition,
  [ConditionKey.CORRUPTED_MODS]: CorruptedModsCondition,
});

type ConditionConstructors = typeof conditionConstructors;
type Instance<T extends Function> = T["prototype"];
type ConditionKeys = keyof ConditionConstructors;

export type Conditions = Instance<
  ConditionConstructors[keyof ConditionConstructors]
>;

export function createCondition<
  K extends ConditionKeys,
  I extends Instance<ConditionConstructors[K]>,
>(kind: K, ...args: ConstructorParameters<ConditionConstructors[K]>): I {
  const Ctor = conditionConstructors[kind];
  // @ts-expect-error - TS cannot verify that the constructor matches the key because of the generic K
  return new Ctor(...args);
}

export function convertRawToConditions(objs: Conditions[]): Conditions[] {
  const conditions: Conditions[] = [];
  for (const condition of objs) {
    conditions.push(createCondition(condition.key, condition as any));
  }
  return conditions;
}

export function serializeConditions(conditions: Conditions[]) {
  const strs = [];
  for (const condition of conditions) {
    strs.push(condition.serialize());
  }
  return strs;
}
