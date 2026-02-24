/**
 * CLI tool to test filter import/export round-trip fidelity.
 *
 * Parses a .filter file into an intermediate representation, then
 * re-serializes it back to .filter format and compares the rules.
 *
 * Usage: pnpm tsx scripts/filter-roundtrip.ts <input.filter> [output.filter]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedFilterAction {
  type: string;
  params: (string | number)[];
}

interface ParsedFilterCondition {
  property: string;
  operator: string | null;
  value:
    | string
    | number
    | boolean
    | string[]
    | { stack: number; mods: string[] };
}

interface ParsedFilterRule {
  type: "Show" | "Hide" | "Minimal";
  conditions: ParsedFilterCondition[];
  actions: ParsedFilterAction[];
  comment?: string;
  continue?: boolean;
  disabled?: boolean;
}

// ─── Operators ───────────────────────────────────────────────────────────────

const VALID_OPERATORS = ["==", "=", "!=", "!", "<", "<=", ">", ">="] as const;

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseValue(value: string): string | number | boolean | string[] {
  const parsedValue = value.replace(/^["']|["']$/g, "");

  if (parsedValue === "True" || parsedValue === "False") {
    return parsedValue === "True";
  }

  if (!Number.isNaN(Number(parsedValue)) && parsedValue.trim() !== "") {
    return Number(parsedValue);
  }

  return parsedValue.split('" "').map((v) => v.replace(/"/g, ""));
}

function parseCondition(condition: string): ParsedFilterCondition {
  const [contentPart] = condition.split("#").map((part) => part.trim());
  const parts = contentPart.trim().split(/\s+/);

  if (parts[0] === "HasExplicitMod") {
    const isOperator = VALID_OPERATORS.includes(parts[1] as any);

    let operator: string | undefined;
    let stack: number | undefined;
    let modString: string | undefined;

    if (isOperator) {
      operator = parts[1];
      stack = Number(parts[2]);
      if (!Number.isNaN(stack)) {
        modString = parts.slice(3).join(" ");
      }
    } else {
      const sortedOperators = [...VALID_OPERATORS].sort(
        (a, b) => b.length - a.length,
      );
      const matchedOp = sortedOperators.find((op) => parts[1]?.startsWith(op));

      if (matchedOp) {
        const potentialStack = parts[1].slice(matchedOp.length);
        if (
          potentialStack.length > 0 &&
          !Number.isNaN(Number(potentialStack))
        ) {
          operator = matchedOp;
          stack = Number(potentialStack);
          modString = parts.slice(2).join(" ");
        }
      }
    }

    if (operator && stack !== undefined && modString !== undefined) {
      const mods = parseValue(modString);
      return {
        property: parts[0],
        operator,
        value: {
          stack,
          mods: Array.isArray(mods) ? mods : [String(mods)],
        },
      };
    }
  }

  const hasOperator =
    parts.length > 1 && VALID_OPERATORS.includes(parts[1] as any);
  const value = hasOperator
    ? parseValue(parts.slice(2).join(" "))
    : parseValue(parts.slice(1).join(" "));

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

/**
 * Parse a .filter file into intermediate ParsedFilterRule[].
 * Handles both active and commented-out rule blocks.
 */
function parseExistingFilter(content: string): ParsedFilterRule[] {
  const rules: ParsedFilterRule[] = [];
  let rule: ParsedFilterRule | null = null;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      // Empty line ends a disabled rule
      if (rule?.disabled) {
        rules.push(rule);
        rule = null;
      }
      continue;
    }

    // Detect commented-out rule blocks: #Show or #Hide or # Show etc.
    const commentedBlockMatch = line.match(
      /^#\s*(Show|Hide|Minimal)\s*(#.*)?$/,
    );
    if (commentedBlockMatch) {
      if (rule) {
        rules.push(rule);
      }
      rule = {
        type: commentedBlockMatch[1] as "Show" | "Hide" | "Minimal",
        conditions: [],
        actions: [],
        comment: commentedBlockMatch[2]
          ? commentedBlockMatch[2].replace(/^#\s*/, "").trim()
          : undefined,
        continue: false,
        disabled: true,
      };
      continue;
    }

    // Inside a disabled rule: parse commented-out conditions/actions
    if (rule?.disabled && line.startsWith("#")) {
      const uncommented = line.replace(/^#\t?/, "");
      const trimmed = uncommented.trim();

      // Skip separators and empty comments
      if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("====") ||
        trimmed.startsWith("----")
      ) {
        // Section separator ends the disabled rule
        rules.push(rule);
        rule = null;
        continue;
      }

      if (trimmed === "Continue") {
        rule.continue = true;
        continue;
      }

      if (
        trimmed.startsWith("Set") ||
        trimmed.startsWith("Play") ||
        trimmed.startsWith("MinimapIcon") ||
        trimmed.startsWith("DisableDropSound") ||
        trimmed.startsWith("EnableDropSound") ||
        trimmed.startsWith("CustomAlertSound")
      ) {
        rule.actions.push(parseAction(trimmed));
        continue;
      }

      // Must be a condition
      rule.conditions.push(parseCondition(trimmed));
      continue;
    }

    // Non-comment line ends a disabled rule
    if (rule?.disabled && !line.startsWith("#")) {
      rules.push(rule);
      rule = null;
      // Fall through to process this line normally
    }

    // Skip comment lines (not part of a disabled rule)
    if (line.startsWith("#")) {
      continue;
    }

    // Active rule block start
    const blockMatch = line.match(/^(Show|Hide|Minimal)(\s+#.*)?$/);
    if (blockMatch) {
      if (rule) {
        rules.push(rule);
      }
      rule = {
        type: blockMatch[1] as "Show" | "Hide" | "Minimal",
        conditions: [],
        actions: [],
        comment: blockMatch[2]
          ? blockMatch[2].replace(/^[\s#]+/, "").trim()
          : undefined,
        continue: false,
        disabled: false,
      };
      continue;
    }

    // Inside an active rule
    if (rule && !rule.disabled) {
      const contentPart = line.split("#")[0].trim();
      if (!contentPart) continue;

      if (contentPart === "Continue") {
        rule.continue = true;
        continue;
      }

      if (
        contentPart.startsWith("Set") ||
        contentPart.startsWith("Play") ||
        contentPart.startsWith("MinimapIcon") ||
        contentPart.startsWith("DisableDropSound") ||
        contentPart.startsWith("EnableDropSound") ||
        contentPart.startsWith("CustomAlertSound")
      ) {
        rule.actions.push(parseAction(contentPart));
        continue;
      }

      rule.conditions.push(parseCondition(contentPart));
    }
  }

  if (rule) {
    rules.push(rule);
  }

  return rules;
}

// ─── Serializer ──────────────────────────────────────────────────────────────

function serializeCondition(condition: ParsedFilterCondition): string {
  const { property, operator, value } = condition;

  // HasExplicitMod with stack
  if (
    property === "HasExplicitMod" &&
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "stack" in value
  ) {
    const { stack, mods } = value as { stack: number; mods: string[] };
    const modStr = mods.map((m) => `"${m}"`).join(" ");
    if (operator) {
      // Use compact format: >=3 not >= 3 (matches PoE filter convention)
      return `HasExplicitMod ${operator}${stack} ${modStr}`;
    }
    return `HasExplicitMod ${modStr}`;
  }

  // HasExplicitMod without stack (plain list)
  if (property === "HasExplicitMod") {
    if (Array.isArray(value)) {
      const modStr = value.map((m) => `"${m}"`).join(" ");
      return `HasExplicitMod ${modStr}`;
    }
    if (typeof value === "string") {
      return `HasExplicitMod "${value}"`;
    }
  }

  // Boolean conditions
  if (typeof value === "boolean") {
    return `${property} ${value ? "True" : "False"}`;
  }

  // Numeric conditions
  if (typeof value === "number") {
    if (operator) {
      return `${property} ${operator} ${value}`;
    }
    return `${property} ${value}`;
  }

  // String array conditions
  if (Array.isArray(value)) {
    // These properties use unquoted space-separated values
    if (
      property === "Rarity" ||
      property === "HasInfluence" ||
      property === "Sockets"
    ) {
      const unquoted = value.join(" ");
      if (operator) {
        return `${property} ${operator} ${unquoted}`;
      }
      return `${property} ${unquoted}`;
    }
    const quoted = value.map((v) => `"${v}"`).join(" ");
    if (operator) {
      return `${property} ${operator} ${quoted}`;
    }
    return `${property} ${quoted}`;
  }

  // String conditions
  if (typeof value === "string") {
    // Sockets uses unquoted values (e.g., 6WWWWWW, RRGGBB)
    if (property === "Sockets") {
      if (operator) {
        return `${property} ${operator} ${value}`;
      }
      return `${property} ${value}`;
    }
    if (operator) {
      return `${property} ${operator} "${value}"`;
    }
    return `${property} "${value}"`;
  }

  return `${property}`;
}

function serializeAction(action: ParsedFilterAction): string {
  const { type, params } = action;

  if (type === "CustomAlertSound") {
    const path = params[0];
    const volume = params[1];
    if (volume !== undefined) {
      return `CustomAlertSound "${path}" ${volume}`;
    }
    return `CustomAlertSound "${path}"`;
  }

  if (params.length === 0) {
    return type;
  }

  return `${type} ${params.join(" ")}`;
}

function serializeRule(rule: ParsedFilterRule): string {
  const lines: string[] = [];
  const prefix = rule.disabled ? "#" : "";

  if (rule.comment) {
    lines.push(`${prefix}${rule.type} # ${rule.comment}`);
  } else {
    lines.push(`${prefix}${rule.type}`);
  }

  for (const condition of rule.conditions) {
    lines.push(`${prefix}\t${serializeCondition(condition)}`);
  }

  for (const action of rule.actions) {
    lines.push(`${prefix}\t${serializeAction(action)}`);
  }

  if (rule.continue) {
    lines.push(`${prefix}\tContinue`);
  }

  return lines.join("\n");
}

// ─── Comparison ──────────────────────────────────────────────────────────────

interface NormalizedRule {
  type: string;
  disabled: boolean;
  conditions: string[];
  actions: string[];
  continue: boolean;
}

function normalizeRule(rule: ParsedFilterRule): NormalizedRule {
  return {
    type: rule.type,
    disabled: !!rule.disabled,
    conditions: rule.conditions.map((c) =>
      serializeCondition(c).replace(/\s+/g, " ").trim(),
    ),
    actions: rule.actions.map((a) =>
      serializeAction(a).replace(/\s+/g, " ").trim(),
    ),
    continue: !!rule.continue,
  };
}

function rulesEqual(a: NormalizedRule, b: NormalizedRule): boolean {
  if (a.type !== b.type) return false;
  if (a.disabled !== b.disabled) return false;
  if (a.continue !== b.continue) return false;
  if (a.conditions.length !== b.conditions.length) return false;
  if (a.actions.length !== b.actions.length) return false;

  for (let i = 0; i < a.conditions.length; i++) {
    if (a.conditions[i] !== b.conditions[i]) return false;
  }
  for (let i = 0; i < a.actions.length; i++) {
    if (a.actions[i] !== b.actions[i]) return false;
  }

  return true;
}

// ─── Original File Rule Extraction ───────────────────────────────────────────

/**
 * Extract rule blocks from the original .filter file as arrays of lines.
 * Each block is [blockType, ...conditions, ...actions, Continue?].
 * Strips comments and normalizes for comparison.
 */
function extractOriginalRuleBlocks(content: string): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] | null = null;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Detect commented-out rule blocks
    const commentedBlockMatch = line.match(
      /^#\s*(Show|Hide|Minimal)\s*(#.*)?$/,
    );
    if (commentedBlockMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = [`#${commentedBlockMatch[1]}`];
      continue;
    }

    // Inside a commented-out block
    if (
      currentBlock &&
      currentBlock[0]?.startsWith("#") &&
      line.startsWith("#")
    ) {
      const uncommented = line.replace(/^#\t?/, "");
      const trimmed = uncommented.trim();

      if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("====") ||
        trimmed.startsWith("----")
      ) {
        blocks.push(currentBlock);
        currentBlock = null;
        continue;
      }

      currentBlock.push(`#\t${trimmed}`);
      continue;
    }

    // Non-comment line ends a commented block
    if (
      currentBlock &&
      currentBlock[0]?.startsWith("#") &&
      !line.startsWith("#")
    ) {
      blocks.push(currentBlock);
      currentBlock = null;
      // Fall through
    }

    // Active rule block start
    const blockMatch = line.match(/^(Show|Hide|Minimal)(\s+#.*)?$/);
    if (blockMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = [blockMatch[1]];
      continue;
    }

    // Skip comment lines outside blocks
    if (line.startsWith("#")) {
      continue;
    }

    // Inside an active rule
    if (currentBlock && !currentBlock[0]?.startsWith("#")) {
      const contentPart = line.split("#")[0].trim();
      if (contentPart) {
        currentBlock.push(`\t${contentPart}`);
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: pnpm tsx scripts/filter-roundtrip.ts <input.filter> [output.filter]",
    );
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputPath = args[1]
    ? resolve(args[1])
    : inputPath.replace(/\.filter$/, ".roundtrip.filter");

  console.log(`Reading: ${inputPath}`);
  const input = readFileSync(inputPath, "utf-8");

  // Step 1: Parse original
  console.log("Parsing original...");
  const parsedOriginal = parseExistingFilter(input);
  const activeCount = parsedOriginal.filter((r) => !r.disabled).length;
  const disabledCount = parsedOriginal.filter((r) => r.disabled).length;
  console.log(
    `Parsed ${parsedOriginal.length} rules (${activeCount} active, ${disabledCount} disabled)`,
  );

  // Step 2: Serialize to output
  console.log("Serializing...");
  const output =
    parsedOriginal.map((rule) => serializeRule(rule)).join("\n\n") + "\n";
  writeFileSync(outputPath, output, "utf-8");
  console.log(`Wrote: ${outputPath}`);

  // Step 3: Re-parse the output
  console.log("Re-parsing output...");
  const parsedRoundtrip = parseExistingFilter(output);
  console.log(`Re-parsed ${parsedRoundtrip.length} rules`);

  // Step 4: Compare rule-by-rule
  console.log("\n--- Comparing rules ---\n");

  const origNorm = parsedOriginal.map(normalizeRule);
  const rtNorm = parsedRoundtrip.map(normalizeRule);

  let diffs = 0;
  const maxRules = Math.max(origNorm.length, rtNorm.length);

  if (origNorm.length !== rtNorm.length) {
    console.log(
      `Rule count mismatch: original=${origNorm.length}, roundtrip=${rtNorm.length}`,
    );
    diffs++;
  }

  for (let i = 0; i < maxRules; i++) {
    const orig = origNorm[i];
    const rt = rtNorm[i];

    if (!orig) {
      diffs++;
      if (diffs <= 30) {
        console.log(`Rule ${i + 1}: EXTRA in roundtrip`);
        console.log(
          `  RT: ${rt!.type} (${rt!.conditions.length} conditions, ${rt!.actions.length} actions)`,
        );
        console.log();
      }
      continue;
    }

    if (!rt) {
      diffs++;
      if (diffs <= 30) {
        console.log(`Rule ${i + 1}: MISSING in roundtrip`);
        console.log(
          `  ORIG: ${orig.type} (${orig.conditions.length} conditions, ${orig.actions.length} actions)`,
        );
        console.log();
      }
      continue;
    }

    if (!rulesEqual(orig, rt)) {
      diffs++;
      if (diffs <= 30) {
        console.log(`Rule ${i + 1} differs:`);
        if (orig.type !== rt.type)
          console.log(`  type: "${orig.type}" vs "${rt.type}"`);
        if (orig.disabled !== rt.disabled)
          console.log(`  disabled: ${orig.disabled} vs ${rt.disabled}`);
        if (orig.continue !== rt.continue)
          console.log(`  continue: ${orig.continue} vs ${rt.continue}`);

        // Show condition diffs
        const maxConds = Math.max(orig.conditions.length, rt.conditions.length);
        for (let j = 0; j < maxConds; j++) {
          const oc = orig.conditions[j] ?? "<missing>";
          const rc = rt.conditions[j] ?? "<missing>";
          if (oc !== rc) {
            console.log(`  condition[${j}]:`);
            console.log(`    ORIG: ${oc}`);
            console.log(`    RT:   ${rc}`);
          }
        }

        // Show action diffs
        const maxActs = Math.max(orig.actions.length, rt.actions.length);
        for (let j = 0; j < maxActs; j++) {
          const oa = orig.actions[j] ?? "<missing>";
          const ra = rt.actions[j] ?? "<missing>";
          if (oa !== ra) {
            console.log(`  action[${j}]:`);
            console.log(`    ORIG: ${oa}`);
            console.log(`    RT:   ${ra}`);
          }
        }
        console.log();
      }
    }
  }

  if (diffs === 0) {
    console.log("PERFECT MATCH - all rules round-trip correctly!");
  } else {
    console.log(
      `\nFound ${diffs} rule differences (showing first ${Math.min(diffs, 30)})`,
    );
  }

  // Also show stats about active vs disabled
  const origActive = parsedOriginal.filter((r) => !r.disabled);
  const rtActive = parsedRoundtrip.filter((r) => !r.disabled);
  const origDisabled = parsedOriginal.filter((r) => r.disabled);
  const rtDisabled = parsedRoundtrip.filter((r) => r.disabled);

  console.log(
    `\nOriginal:   ${origActive.length} active, ${origDisabled.length} disabled`,
  );
  console.log(
    `Roundtrip:  ${rtActive.length} active, ${rtDisabled.length} disabled`,
  );

  // Step 5: Cross-validate against original file content
  // Extract rule blocks from original file and compare line-by-line with serialized output
  console.log("\n--- Cross-validating against original file ---\n");

  const origRuleBlocks = extractOriginalRuleBlocks(input);
  const serializedRuleBlocks = parsedOriginal.map((rule) => {
    const lines: string[] = [];
    const prefix = rule.disabled ? "#" : "";

    // Just the block type (no comment)
    lines.push(`${prefix}${rule.type}`);

    for (const condition of rule.conditions) {
      lines.push(`${prefix}\t${serializeCondition(condition)}`);
    }
    for (const action of rule.actions) {
      lines.push(`${prefix}\t${serializeAction(action)}`);
    }
    if (rule.continue) {
      lines.push(`${prefix}\tContinue`);
    }
    return lines;
  });

  let crossDiffs = 0;
  const maxBlocks = Math.max(
    origRuleBlocks.length,
    serializedRuleBlocks.length,
  );

  if (origRuleBlocks.length !== serializedRuleBlocks.length) {
    console.log(
      `Block count mismatch: original=${origRuleBlocks.length}, serialized=${serializedRuleBlocks.length}`,
    );
  }

  for (let i = 0; i < maxBlocks; i++) {
    const origBlock = origRuleBlocks[i];
    const serBlock = serializedRuleBlocks[i];

    if (!origBlock || !serBlock) {
      crossDiffs++;
      if (crossDiffs <= 20) {
        console.log(
          `Block ${i + 1}: ${!origBlock ? "MISSING in original" : "EXTRA in serialized"}`,
        );
      }
      continue;
    }

    // Compare normalized lines
    const origNormLines = origBlock.map((l) => l.replace(/\s+/g, " ").trim());
    const serNormLines = serBlock.map((l) => l.replace(/\s+/g, " ").trim());

    const maxLines = Math.max(origNormLines.length, serNormLines.length);
    let blockHasDiff = false;

    for (let j = 0; j < maxLines; j++) {
      const ol = origNormLines[j] ?? "<missing>";
      const sl = serNormLines[j] ?? "<missing>";
      if (ol !== sl) {
        if (!blockHasDiff) {
          crossDiffs++;
          if (crossDiffs <= 20) {
            console.log(`Block ${i + 1} (rule type: ${origBlock[0]?.trim()}):`);
          }
          blockHasDiff = true;
        }
        if (crossDiffs <= 20) {
          console.log(`  line ${j}: ORIG: ${ol}`);
          console.log(`  line ${j}: SER:  ${sl}`);
        }
      }
    }
    if (blockHasDiff && crossDiffs <= 20) {
      console.log();
    }
  }

  if (crossDiffs === 0) {
    console.log(
      "PERFECT CROSS-VALIDATION - serialized output matches original rules!",
    );
  } else {
    console.log(
      `\nFound ${crossDiffs} cross-validation differences (showing first ${Math.min(crossDiffs, 20)})`,
    );
  }

  return diffs + crossDiffs;
}

const exitCode = main();
process.exit(exitCode > 0 ? 1 : 0);
