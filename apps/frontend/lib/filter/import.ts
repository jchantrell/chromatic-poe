import { type Conditions, Operator } from "./condition";
import { type Actions, IconSize, Shape, Color, DEFAULT_STYLE } from "./action";
import { ulid } from "ulid";
import items from "@pkgs/data/poe2/items.json";
import { clone, camelCase } from "@pkgs/lib/utils";

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

const LIST_KEYS = ["Rarity"];

function parseCondition(condition: string): ParsedFilterCondition {
  const [contentPart] = condition.split("#").map((part) => part.trim());
  const parts = contentPart.trim().split(/\s+/);

  const hasOperator = parts.length > 1 && VALID_OPERATORS.includes(parts[1]);
  let value = hasOperator
    ? parseValue(parts.slice(2).join(" "))
    : parseValue(parts.slice(1).join(" "));

  if (LIST_KEYS.includes(parts[0])) {
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
  value = value.replace(/^["']|["']$/g, "");

  if (value === "True" || value === "False") {
    return value === "True";
  }

  if (!Number.isNaN(Number(value))) {
    return Number(value);
  }

  return value.split('" "').map((v) => v.replace(/"/g, ""));
}

export function parseExistingFilter(content: string): ParsedFilterRule[] {
  const rules: ParsedFilterRule[] = [];
  let currentRule: ParsedFilterRule | null = null;
  let currentComment: string | undefined;
  let currentSection: string | undefined;
  let hasFoundFirstSection = false; // Track if we've found any section headers

  const lines = content.split("\n").map((line) => line.trim());

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("#====")) {
      continue;
    }

    // looking for section headers
    const sectionMatch = line.match(/^#\s*\[\[(\d+)\]\]\s*(.+)$/);
    if (sectionMatch) {
      currentSection = `[${sectionMatch[1]}] ${sectionMatch[2]}`;
      hasFoundFirstSection = true;
      continue;
    }

    if (line.startsWith("#")) {
      if (
        line.trim().startsWith("# Show") ||
        line.trim().startsWith("# Hide")
      ) {
        continue;
      }
      if (!hasFoundFirstSection || currentSection) {
        currentComment = line.slice(1).trim();
      }
      continue;
    }

    const [contentPart, commentPart] = line
      .split("#")
      .map((part) => part.trim());

    if (/^(Show|Hide|Minimal)$/.test(contentPart)) {
      if (currentRule) {
        rules.push(currentRule);
      }

      currentRule = {
        type: contentPart as "Show" | "Hide" | "Minimal",
        conditions: [],
        actions: [],
        comment: hasFoundFirstSection
          ? currentSection
          : currentComment || commentPart,
        continue: false,
      };
      currentComment = undefined;
      continue;
    }

    if (currentRule && contentPart) {
      if (contentPart === "Continue") {
        currentRule.continue = true;
      } else if (
        contentPart.startsWith("Set") ||
        contentPart.startsWith("Play") ||
        contentPart.startsWith("MinimapIcon") ||
        contentPart.startsWith("DisableDropSound") ||
        contentPart.startsWith("EnableDropSound") ||
        contentPart.startsWith("CustomAlertSound")
      ) {
        currentRule.actions.push(parseAction(contentPart));
      } else {
        currentRule.conditions.push(parseCondition(contentPart));
      }
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  return rules;
}

export async function importFilter(raw: string) {
  const rules = parseExistingFilter(raw);

  const convertedRules: FilterRule[] = [];

  for (const rule of rules) {
    const basesToAdd = new Set<string>();
    const conditions: Conditions = {};

    const baseTypeConditions = rule.conditions.filter(
      (condition) => condition.property === "BaseType",
    );

    for (const condition of baseTypeConditions) {
      const bases = condition.value;
      if (typeof bases === "string") {
        basesToAdd.add(bases);
      } else if (Array.isArray(bases)) {
        for (const base of bases) {
          basesToAdd.add(base);
        }
      }
    }

    const otherConditions = rule.conditions.filter(
      (condition) => !["BaseType"].includes(condition.property),
    );

    for (const condition of otherConditions) {
      const { property, operator, value } = condition;

      if (property === "WaystoneTier") {
        conditions.mapTier = {
          operator,
          value,
        };
        continue;
      }

      conditions[camelCase(property)] = {
        operator,
        value,
      };
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
          r: action.params[0],
          g: action.params[1],
          b: action.params[2],
          a: action.params[3],
        };
      }
      if (action.type === "SetBackgroundColor") {
        actions.background = {
          r: action.params[0],
          g: action.params[1],
          b: action.params[2],
          a: action.params[3],
        };
      }
      if (action.type === "SetBorderColor") {
        actions.border = {
          r: action.params[0],
          g: action.params[1],
          b: action.params[2],
          a: action.params[3],
        };
      }
      if (action.type === "SetFontSize") {
        actions.fontSize = action.params[0];
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
      name: rule.comment ?? "Imported rule",
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
