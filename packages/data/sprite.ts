import minimapIcons from "./tables/English/MinimapIcons.json";
import fs from "node:fs";

const WIDTH = 64;
const HEIGHT = 64;

const SHEET_WIDTH = 896;

const reg =
  /(LootFilter)(Large|Medium|Small)(Blue|Green|Brown|Red|White|Yellow|Cyan|Grey|Orange|Pink|Purple)(Circle|Diamond|Hexagon|Square|Star|Triangle|Cross|Moon|Raindrop|Kite|Pentagon|UpsideDownHouse)/;

function parseLootFilterId(id: string) {
  const match = id.match(reg);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    size: match[2],
    color: match[3],
    shape: match[4],
  };
}

function recursivelySetKeys(
  object: Record<string, unknown>,
  path: (string | null)[],
  value: object,
) {
  let schema = object;
  for (let i = 0; i < path.length - 1; i++) {
    const entry = path[i];
    if (!entry) {
      continue;
    }
    const sameKey = path[i - 1] && entry === path[i - 1];
    if (!schema[entry] && !sameKey) {
      schema[entry] = {};
    }
    schema = sameKey ? schema : schema[entry];
  }
  schema[path[path.length - 1] as string] = value;
}

function main() {
  const table = {};

  for (let i = 0; i < minimapIcons.length; i++) {
    const icon = minimapIcons[i];
    if (!icon) break;
    if (icon.Id.startsWith("LootFilter")) {
      const { size, color, shape } = parseLootFilterId(icon.Id);
      const perRow = SHEET_WIDTH / WIDTH;
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = col * WIDTH;
      const y = row * HEIGHT;
      recursivelySetKeys(table, [color, shape, size], { x, y });
    }
  }

  fs.writeFileSync("../assets/minimap.json", JSON.stringify(table));
}

main();
