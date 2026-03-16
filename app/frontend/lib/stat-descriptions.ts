export type Matcher =
  | { type: "any" }
  | { type: "exact"; value: number }
  | { type: "range"; min: number | null; max: number | null }
  | { type: "not"; value: number };

export type HandlerFn = (values: number[]) => number[];

export interface ConditionEntry {
  matchers: Matcher[];
  template: string;
  handlers: HandlerFn[];
}

export interface StatDescriptionEntry {
  statIds: string[];
  conditions: ConditionEntry[];
}

function parseMatcher(token: string): Matcher {
  if (token === "#") return { type: "any" };
  if (token.startsWith("!"))
    return { type: "not", value: parseInt(token.slice(1), 10) };
  if (token.includes("|")) {
    const [a, b] = token.split("|");
    return {
      type: "range",
      min: a === "#" ? null : parseInt(a, 10),
      max: b === "#" ? null : parseInt(b, 10),
    };
  }
  return { type: "exact", value: parseInt(token, 10) };
}

function matchesValue(matcher: Matcher, value: number): boolean {
  switch (matcher.type) {
    case "any":
      return true;
    case "exact":
      return value === matcher.value;
    case "not":
      return value !== matcher.value;
    case "range": {
      const aboveMin = matcher.min === null || value >= matcher.min;
      const belowMax = matcher.max === null || value <= matcher.max;
      return aboveMin && belowMax;
    }
  }
}

const HANDLER_FACTORIES: Record<string, (statIndex: number) => HandlerFn> = {
  negate: (i) => (vals) => {
    const out = [...vals];
    out[i] = -out[i];
    return out;
  },
  double: (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] * 2;
    return out;
  },
  negate_and_double: (i) => (vals) => {
    const out = [...vals];
    out[i] = -out[i] * 2;
    return out;
  },
  times_twenty: (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] * 20;
    return out;
  },
  times_one_point_five: (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] * 1.5;
    return out;
  },
  "30%_of_value": (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] * 0.3;
    return out;
  },
  "60%_of_value": (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] * 0.6;
    return out;
  },
  per_minute_to_per_second: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 60) * 100) / 100;
    return out;
  },
  per_minute_to_per_second_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round(out[i] / 60);
    return out;
  },
  per_minute_to_per_second_1dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 60) * 10) / 10;
    return out;
  },
  per_minute_to_per_second_2dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 60) * 100) / 100;
    return out;
  },
  per_minute_to_per_second_2dp_if_required: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 60) * 100) / 100;
    return out;
  },
  "permyriad_per_minute_to_%_per_second": (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10000 / 60) * 100) / 100;
    return out;
  },
  milliseconds_to_seconds: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 1000) * 100) / 100;
    return out;
  },
  milliseconds_to_seconds_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round(out[i] / 1000);
    return out;
  },
  milliseconds_to_seconds_1dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 1000) * 10) / 10;
    return out;
  },
  milliseconds_to_seconds_2dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 1000) * 100) / 100;
    return out;
  },
  milliseconds_to_seconds_2dp_if_required: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 1000) * 100) / 100;
    return out;
  },
  deciseconds_to_seconds: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10) * 100) / 100;
    return out;
  },
  divide_by_two_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round(out[i] / 2);
    return out;
  },
  divide_by_three: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 3) * 100) / 100;
    return out;
  },
  divide_by_four: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 4) * 100) / 100;
    return out;
  },
  divide_by_five: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 5) * 100) / 100;
    return out;
  },
  divide_by_six: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 6) * 100) / 100;
    return out;
  },
  divide_by_ten_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round(out[i] / 10);
    return out;
  },
  divide_by_ten_1dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10) * 10) / 10;
    return out;
  },
  divide_by_ten_1dp_if_required: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10) * 10) / 10;
    return out;
  },
  divide_by_twelve: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 12) * 100) / 100;
    return out;
  },
  divide_by_fifteen_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round(out[i] / 15);
    return out;
  },
  divide_by_twenty: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 20) * 100) / 100;
    return out;
  },
  divide_by_twenty_then_double_0dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 20) * 2);
    return out;
  },
  divide_by_one_hundred: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 100) * 100) / 100;
    return out;
  },
  divide_by_one_hundred_2dp: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 100) * 100) / 100;
    return out;
  },
  divide_by_one_hundred_2dp_if_required: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 100) * 100) / 100;
    return out;
  },
  divide_by_one_hundred_and_negate: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((-out[i] / 100) * 100) / 100;
    return out;
  },
  divide_by_one_thousand: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 1000) * 100) / 100;
    return out;
  },
  multiplicative_damage_modifier: (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] + 100;
    return out;
  },
  old_leech_percent: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 5) * 100) / 100;
    return out;
  },
  old_leech_permyriad: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10000 / 5) * 100) / 100;
    return out;
  },
  plus_two_hundred: (i) => (vals) => {
    const out = [...vals];
    out[i] = out[i] + 200;
    return out;
  },
  locations_to_metres: (i) => (vals) => {
    const out = [...vals];
    out[i] = Math.round((out[i] / 10) * 100) / 100;
    return out;
  },
};

const IGNORED_HANDLER_TOKENS = new Set([
  "canonical_line",
  "canonical_stat",
  "reminderstring",
  "display_indexable_skill",
  "display_indexable_support",
  "affliction_reward_type",
  "mod_value_to_item_class",
  "passive_hash",
  "tree_expansion_jewel_passive",
  "weapon_tree_unique_base_type_name",
]);

function parseHandlers(tokens: string[], statCount: number): HandlerFn[] {
  const handlers: HandlerFn[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (IGNORED_HANDLER_TOKENS.has(token)) {
      i++;
      if (
        i < tokens.length &&
        (token === "reminderstring" ||
          token === "canonical_stat" ||
          token === "display_indexable_skill" ||
          token === "display_indexable_support")
      ) {
        i++;
      }
      continue;
    }

    if (HANDLER_FACTORIES[token]) {
      i++;
      const statIdx =
        i < tokens.length && /^\d+$/.test(tokens[i])
          ? parseInt(tokens[i], 10) - 1
          : 0;
      if (i < tokens.length && /^\d+$/.test(tokens[i])) i++;
      if (statIdx >= 0 && statIdx < statCount) {
        handlers.push(HANDLER_FACTORIES[token](statIdx));
      }
      continue;
    }

    i++;
  }
  return handlers;
}

function parseConditionLine(
  line: string,
  statCount: number,
): ConditionEntry | null {
  const quoteStart = line.indexOf('"');
  if (quoteStart === -1) return null;

  const quoteEnd = line.indexOf('"', quoteStart + 1);
  if (quoteEnd === -1) return null;

  const template = line.slice(quoteStart + 1, quoteEnd);
  const beforeQuote = line.slice(0, quoteStart).trim();
  const afterQuote = line.slice(quoteEnd + 1).trim();

  const matcherTokens = beforeQuote.split(/\s+/).filter(Boolean);
  if (matcherTokens.length < statCount) return null;

  const matchers = matcherTokens.slice(0, statCount).map(parseMatcher);
  const handlerTokens = afterQuote.split(/\s+/).filter(Boolean);
  const handlers = parseHandlers(handlerTokens, statCount);

  return { matchers, template, handlers };
}

export function parseStatDescriptionFile(
  content: string,
): Record<string, StatDescriptionEntry> {
  const lookup: Record<string, StatDescriptionEntry> = {};
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === "description" || line.startsWith("no_description")) {
      const isNoDesc = line.startsWith("no_description");

      if (isNoDesc && line !== "no_description") {
        const noDescIds = line
          .slice("no_description".length)
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        for (const statId of noDescIds) {
          lookup[statId] = { statIds: [statId], conditions: [] };
        }
        i++;
        continue;
      }

      i++;

      if (i >= lines.length) break;
      const idLine = lines[i].trim();
      const idParts = idLine.split(/\s+/).filter(Boolean);
      if (idParts.length < 2 || !/^\d+$/.test(idParts[0])) {
        if (isNoDesc) {
          for (const statId of idParts) {
            lookup[statId] = { statIds: [statId], conditions: [] };
          }
        }
        i++;
        continue;
      }

      const statCount = parseInt(idParts[0], 10);
      const statIds = idParts.slice(1);

      if (isNoDesc) {
        for (const id of statIds) {
          lookup[id] = { statIds, conditions: [] };
        }
        i++;
        continue;
      }

      i++;
      if (i >= lines.length) break;

      const countLine = lines[i].trim();
      if (!/^\d+$/.test(countLine)) {
        i++;
        continue;
      }
      const numConditions = parseInt(countLine, 10);
      i++;

      const conditions: ConditionEntry[] = [];
      for (let c = 0; c < numConditions && i < lines.length; c++) {
        const condLine = lines[i].trim();
        if (
          condLine.startsWith("lang ") ||
          condLine === "description" ||
          condLine === "no_description" ||
          condLine === ""
        ) {
          break;
        }
        const entry = parseConditionLine(condLine, statCount);
        if (entry) conditions.push(entry);
        i++;
      }

      // Skip non-English language blocks
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l === "" || l === "description" || l === "no_description") {
          break;
        }
        i++;
      }

      const descEntry: StatDescriptionEntry = { statIds, conditions };
      for (const id of statIds) {
        lookup[id] = descEntry;
      }
      continue;
    }

    i++;
  }

  return lookup;
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case "+d":
    case "+":
      return value >= 0 ? `+${value}` : `${value}`;
    case "d":
      return `${Math.floor(value)}`;
    default:
      return `${value}`;
  }
}

function substituteTemplate(template: string, values: number[]): string {
  return template.replace(/\{(\d+)(?::([^}]+))?\}/g, (_, indexStr, format) => {
    const idx = parseInt(indexStr, 10);
    const val = idx < values.length ? values[idx] : 0;
    return formatValue(val, format || "");
  });
}

export function formatStatDescription(
  entry: StatDescriptionEntry,
  values: [number, number][],
): string {
  if (!entry?.conditions.length || !values.length) return "";

  const minValues = values.map(([min]) => min);
  const maxValues = values.map(([, max]) => max);

  const matched = entry.conditions.find((cond) =>
    cond.matchers.every((m, i) => {
      const val = i < minValues.length ? minValues[i] : 0;
      return matchesValue(m, val);
    }),
  );

  if (!matched) return "";

  let transformedMin = [...minValues];
  let transformedMax = [...maxValues];
  for (const handler of matched.handlers) {
    transformedMin = handler(transformedMin);
    transformedMax = handler(transformedMax);
  }

  const isRange = transformedMin.some((v, i) => v !== transformedMax[i]);

  if (isRange) {
    return formatRange(matched.template, transformedMin, transformedMax);
  }

  return substituteTemplate(matched.template, transformedMin);
}

function formatRange(
  template: string,
  mins: number[],
  maxes: number[],
): string {
  return template.replace(/\{(\d+)(?::([^}]+))?\}/g, (_, indexStr, format) => {
    const idx = parseInt(indexStr, 10);
    const min = idx < mins.length ? mins[idx] : 0;
    const max = idx < maxes.length ? maxes[idx] : 0;
    if (min === max) return formatValue(min, format || "");
    const fmt = format || "";
    if (fmt === "+d" || fmt === "+") {
      return `+(${Math.abs(min)}-${Math.abs(max)})`;
    }
    return `(${min}-${max})`;
  });
}

export { matchesValue, parseMatcher, parseConditionLine, parseHandlers };
