import {
  ConditionKey,
  type Conditions,
  createCondition,
  Operator,
} from "./condition";
import { type Actions, IconSize, Shape, Color, DEFAULT_STYLE } from "./action";
import { ulid } from "ulid";
import items from "@pkgs/data/poe2/items.json";
import { itemIndex } from "./items";
import { clone, camelCase } from "@pkgs/lib/utils";
import type { FilterRule, FilterItem } from "./filter";

interface ParsedFilterAction {
  type: string;
  params: (string | number)[];
}

interface ParsedFilterRule {
  type: "Show" | "Hide" | "Minimal";
  conditions: ParsedFilterCondition[];
  actions: ParsedFilterAction[];
  comment?: string;
  continue?: boolean;
}

interface ParsedFilterCondition {
  property: string;
  operator: string | null;
  value: string | number | boolean | string[];
}

const VALID_OPERATORS = [
  Operator.EXACT,
  Operator.EQ,
  Operator.NEQ2,
  Operator.NEQ,
  Operator.LT,
  Operator.LTE,
  Operator.GT,
  Operator.GTE,
] as const;

function containsExactWord(text: string, searchWord: string): boolean {
  const regex = new RegExp(`\\b${searchWord}\\b`, "i");
  return regex.test(text);
}

function baseExists(name: string) {
  return items.find((item) => item.base.toLowerCase() === name.toLowerCase());
}

function getClasses(value: number | string | boolean | string[]) {
  if (Array.isArray(value) && value.includes("Logbook")) {
    return replaceClass("Logbook", ["Expedition Logbooks"], value);
  }
  if (Array.isArray(value) && value.includes("Jewel")) {
    return replaceClass("Jewel", ["Jewels"], value);
  }
  if (Array.isArray(value) && value.includes("Currency")) {
    return replaceClass("Currency", ["Stackable Currency"], value);
  }
  if (Array.isArray(value) && value.includes("Flasks")) {
    return replaceClass("Flasks", ["Life Flasks", "Mana Flasks"], value);
  }

  return value;
}

function replaceClass(
  classToRemove: string,
  classesToAdd: string[],
  value: string[],
) {
  const filtered = value.filter((v) => v !== classToRemove);
  filtered.push(...classesToAdd);
  return filtered;
}

function parseCondition(condition: string): ParsedFilterCondition {
  const [contentPart] = condition.split("#").map((part) => part.trim());
  const parts = contentPart.trim().split(/\s+/);

  const hasOperator = parts.length > 1 && VALID_OPERATORS.includes(parts[1]);
  let value = hasOperator
    ? parseValue(parts.slice(2).join(" "))
    : parseValue(parts.slice(1).join(" "));

  if (["Rarity"].includes(parts[0]) && Array.isArray(value)) {
    value = value[0].split(" ");
  }

  return {
    property: parts[0],
    operator: hasOperator ? parts[1] : null,
    value,
  };
}

function parseAction(action: string): ParsedFilterAction {
  const parts = action.trim().split(/\s+/);
  return {
    type: parts[0],
    params: parts
      .slice(1)
      .map((param) => (Number.isNaN(Number(param)) ? param : Number(param))),
  };
}

function parseValue(value: string): string | number | boolean | string[] {
  const parsedValue = value.replace(/^["']|["']$/g, "");

  if (parsedValue === "True" || parsedValue === "False") {
    return parsedValue === "True";
  }

  if (!Number.isNaN(Number(parsedValue))) {
    return Number(parsedValue);
  }

  return parsedValue.split('" "').map((v) => v.replace(/"/g, ""));
}

export function parseExistingFilter(content: string): ParsedFilterRule[] {
  const rules: ParsedFilterRule[] = [];
  let rule: ParsedFilterRule | null = null;
  let comment: string | undefined;
  let section: string | undefined;
  let foundFirstSection = false;

  const lines = content.split("\n").map((line) => line.trim());

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#====") || line.startsWith("#----")) {
      continue;
    }

    const sectionMatch = line.match(/^#\s*\[{1,2}(\d+)\]{1,2}\s*(.+)$/);
    if (sectionMatch) {
      section = `[${sectionMatch[1]}] ${sectionMatch[2]}`;
      foundFirstSection = true;
      continue;
    }

    if (line.startsWith("#")) {
      if (
        line.trim().startsWith("# Show") ||
        line.trim().startsWith("# Hide")
      ) {
        continue;
      }
      if (!foundFirstSection || section) {
        comment = line.slice(1).trim();
      }
      continue;
    }

    const [key, commentPart] = line.split("#").map((part) => part.trim());

    if (/^(Show|Hide|Minimal)$/.test(key)) {
      if (rule) {
        rules.push(rule);
      }

      rule = {
        type: key as "Show" | "Hide" | "Minimal",
        conditions: [],
        actions: [],
        comment: foundFirstSection ? section : comment || commentPart,
        continue: false,
      };
      comment = undefined;
      continue;
    }

    if (rule && key) {
      if (key === "Continue") {
        rule.continue = true;
        continue;
      }
      if (
        key.startsWith("Set") ||
        key.startsWith("Play") ||
        key.startsWith("MinimapIcon") ||
        key.startsWith("DisableDropSound") ||
        key.startsWith("EnableDropSound") ||
        key.startsWith("CustomAlertSound")
      ) {
        rule.actions.push(parseAction(key));
        continue;
      }
      rule.conditions.push(parseCondition(key));
    }
  }

  if (rule) {
    rules.push(rule);
  }

  return rules;
}

export async function importFilter(raw: string) {
  const rules = parseExistingFilter(raw);
  const convertedRules: FilterRule[] = [];

  for (const rule of rules) {
    const basesToAdd = new Set<string>();
    const conditions: Conditions[] = [];

    const baseTypeConditions = rule.conditions.filter(
      (condition) => condition.property === "BaseType",
    );

    for (const condition of baseTypeConditions) {
      const bases = condition.value;
      if (typeof bases === "string") {
        // exact match
        if (baseExists(bases)) {
          basesToAdd.add(bases);
          continue;
        }
        // fuzzy match
        const fuzzy = itemIndex.search({
          $and: [{ name: `'${bases.trim()}` }],
        });
        for (const result of fuzzy) {
          if (containsExactWord(result.item.name, bases)) {
            basesToAdd.add(result.item.name);
          }
        }
      }

      if (Array.isArray(bases)) {
        for (const base of bases) {
          // exact match
          if (baseExists(base)) {
            basesToAdd.add(base);
            continue;
          }
          // fuzzy match
          const fuzzy = itemIndex.search({
            $and: [{ name: `'${base.trim()}` }],
          });
          for (const result of fuzzy) {
            if (containsExactWord(result.item.name, base)) {
              basesToAdd.add(result.item.name);
            }
          }
        }
      }
    }

    const otherConditions = rule.conditions.filter(
      (condition) => !["BaseType"].includes(condition.property),
    );

    for (const condition of otherConditions) {
      const { property, operator, value } = condition;

      // skip these conditions for now as mod filtering isnt supported yet
      if (property === "HasEnchantment") {
        continue;
      }
      if (property === "HasExplicitMod") {
        continue;
      }
      if (property === "SocketGroup") {
        continue;
      }
      if (property === "Class") {
        const classes = getClasses(value) as string[];
        conditions.push(
          createCondition(ConditionKey.CLASSES, {
            value: classes,
          }),
        );
        continue;
      }
      if (property === "WaystoneTier") {
        conditions.push(
          createCondition(ConditionKey.MAP_TIER, {
            operator,
            value: Number(value),
          }),
        );
        continue;
      }

      if (property === "AnyEnchantment") {
        conditions.push(
          createCondition(ConditionKey.ANY_ENCHANTMENT, {
            value: value === "true",
          }),
        );
        continue;
      }

      conditions.push(
        createCondition(camelCase(property) as ConditionKey, {
          operator,
          value,
        }),
      );
    }

    const itemBases: FilterItem[] = [];

    for (const base of basesToAdd) {
      const itemBase = items.find((item) => item.name === base);
      if (itemBase) {
        itemBases.push({
          name: itemBase.name,
          itemClass: itemBase.itemClass,
          category: itemBase.category,
          base: itemBase.base,
          enabled: true,
        });
      }
    }

    const actions: Actions = {};

    for (const action of rule.actions) {
      if (action.type === "SetTextColor") {
        actions.text = {
          r: Number(action.params[0]),
          g: Number(action.params[1]),
          b: Number(action.params[2]),
          a: action.params[3] ? Number(action.params[3]) : 240,
        };
      }
      if (action.type === "SetBackgroundColor") {
        actions.background = {
          r: Number(action.params[0]),
          g: Number(action.params[1]),
          b: Number(action.params[2]),
          a: action.params[3] ? Number(action.params[3]) : 240,
        };
      }
      if (action.type === "SetBorderColor") {
        actions.border = {
          r: Number(action.params[0]),
          g: Number(action.params[1]),
          b: Number(action.params[2]),
          a: action.params[3] ? Number(action.params[3]) : 240,
        };
      }
      if (action.type === "SetFontSize") {
        actions.fontSize = Number(action.params[0]);
      }
      if (action.type === "MinimapIcon") {
        const size = action.params[0];
        actions.icon = {
          size:
            size === 2
              ? IconSize.Small
              : size === 1
                ? IconSize.Medium
                : IconSize.Large,
          color: Color[action.params[1] as keyof typeof Color],
          shape: Shape[action.params[2] as keyof typeof Shape],
          enabled: true,
        };
      }
      if (action.type === "PlayEffect") {
        actions.beam = {
          enabled: true,
          color: Color[action.params[0] as keyof typeof Color],
          temp: action.params[1] === "true",
        };
      }
      if (action.type === "DisableDropSound") {
        actions.dropSound = {
          enabled: true,
          toggle: false,
        };
      }
      if (action.type === "EnableDropSound") {
        actions.dropSound = {
          enabled: true,
          toggle: true,
        };
      }
      if (action.type === "CustomAlertSound") {
        actions.sound = {
          enabled: true,
          path: {
            value: String(action.params[0]),
            path: String(action.params[0]),
            type: "custom",
          },
          volume:
            typeof action.params[1] === "number"
              ? action.params[1]
              : Number.parseInt(action.params[1]),
        };
      }
      if (action.type === "PlayAlertSound") {
        actions.sound = {
          enabled: true,
          path: {
            value: String(action.params[0]),
            path: "",
            type: "default",
          },
          volume:
            typeof action.params[1] === "number"
              ? action.params[1]
              : Number.parseInt(action.params[1]),
        };
      }
    }

    if (!actions.text) {
      actions.text = clone(DEFAULT_STYLE.text);
    }

    if (!actions.border) {
      actions.border = clone(DEFAULT_STYLE.border);
    }

    if (!actions.background) {
      actions.background = clone(DEFAULT_STYLE.background);
    }

    const convertedRule: FilterRule = {
      id: ulid(),
      name: rule.comment ?? "Imported",
      show: rule.type === "Show",
      enabled: true,
      conditions: conditions,
      actions,
      bases: itemBases,
      continue: rule.continue ?? false,
    };

    convertedRules.push(convertedRule);
  }

  return convertedRules;
}
